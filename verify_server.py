"""
BGMI Profile Verification Microservice
=======================================
FastAPI server using EasyOCR to extract IGN and UID from BGMI profile screenshots.
Runs as a companion service alongside the Next.js app.

Usage:
    python verify_server.py
    # Server starts at http://localhost:8000
"""

import sys
import os

# Fix Windows console encoding — EasyOCR progress bar uses Unicode block chars (█)
# that cp1252 can't encode. Force UTF-8 before any other imports.
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import re
import io
import logging
from contextlib import asynccontextmanager

import easyocr
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global EasyOCR Reader (singleton — initialized once at startup)
# ---------------------------------------------------------------------------
ocr_reader: easyocr.Reader | None = None

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize heavy resources at startup, clean up on shutdown."""
    global ocr_reader
    logger.info("Initializing EasyOCR reader (this may take a moment on first run)...")
    ocr_reader = easyocr.Reader(["en"], gpu=False)
    logger.info("EasyOCR reader ready.")
    yield
    logger.info("Shutting down verification server.")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="BGMI Profile Verification Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:9002"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "ocr_ready": ocr_reader is not None}


# ---------------------------------------------------------------------------
# Verification Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/profile/verify-id")
async def verify_profile(
    file: UploadFile = File(...),
    profile_id: str = Form(...),
    profile_username: str = Form(...),
):
    """
    Accepts a BGMI profile screenshot, extracts text via EasyOCR,
    and compares the detected IGN / UID against the submitted values.

    Returns a JSON payload the frontend uses to render verification state.
    """
    # ------------------------------------------------------------------
    # 1. Validate the uploaded file
    # ------------------------------------------------------------------
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: PNG, JPEG, WEBP.",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5 MB.",
        )

    # Quick sanity check and Resize to speed up OCR
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.verify()
        
        # Re-open for modification since verify() exhausts the file pointer
        img = Image.open(io.BytesIO(raw_bytes))
        
        # Resize if too large to speed up EasyOCR processing
        max_dim = 1000
        if max(img.size) > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            
        img_byte_arr = io.BytesIO()
        # Convert to RGB to ensure jpeg support (e.g. if PNG with alpha)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(img_byte_arr, format='JPEG', quality=85)
        processed_bytes = img_byte_arr.getvalue()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image.",
        )

    # ------------------------------------------------------------------
    # 2. Run EasyOCR
    # ------------------------------------------------------------------
    try:
        logger.info("Running OCR on uploaded screenshot...")
        results = ocr_reader.readtext(processed_bytes)

        extracted_lines = [item[1].strip() for item in results]
        full_text = " ".join(extracted_lines)
        logger.info(f"Raw OCR text: {full_text}")
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        return JSONResponse(
            content={
                "success": False,
                "status": "unverified",
                "message": "OCR processing failed. Please try a clearer screenshot.",
                "show_badge": False,
            }
        )

    # ------------------------------------------------------------------
    # 3. Extract Game ID using regex (5-12 digit sequences)
    # ------------------------------------------------------------------
    detected_ids = re.findall(r"\d{5,12}", full_text)
    logger.info(f"Detected numeric IDs: {detected_ids}")

    # ------------------------------------------------------------------
    # 4. Normalize inputs
    # ------------------------------------------------------------------
    target_id = str(profile_id).strip()
    
    def normalize(text: str) -> str:
        # Lowercase, replace non-alphanumeric (except spaces) with space
        cleaned = re.sub(r"[^a-z0-9 ]", " ", text.lower())
        # Collapse multiple spaces into one and strip
        return re.sub(r"\s+", " ", cleaned).strip()
        
    target_username = normalize(profile_username)

    # ------------------------------------------------------------------
    # 5. Cross-match — strict exact matching
    # ------------------------------------------------------------------
    id_matches = target_id in detected_ids

    # For username: normalize each extracted line and check for exact match
    normalized_lines = [normalize(line) for line in extracted_lines]
    username_matches = any(target_username == line for line in normalized_lines)

    # Also check if the target username appears as a standalone token
    # in any line (handles lines like "IGN: AURA Piyush | Level 75")
    if not username_matches:
        # Try matching against the full normalized text split into segments
        for line in normalized_lines:
            # Check if the username is an exact contiguous segment
            if target_username in line:
                # Verify it's not a partial word match by checking boundaries
                pattern = r"(?:^|(?<=\s))" + re.escape(target_username) + r"(?=\s|$)"
                if re.search(pattern, line):
                    username_matches = True
                    break

    logger.info(f"ID match: {id_matches} (target={target_id}, found={detected_ids})")
    logger.info(f"Username match: {username_matches} (target={target_username})")

    # ------------------------------------------------------------------
    # 6. Build response
    # ------------------------------------------------------------------
    if id_matches and username_matches:
        return {
            "success": True,
            "status": "verified",
            "message": "Verification successful. Profile details match the screenshot.",
            "show_badge": True,
            "extracted": {
                "uid": target_id,
                "ign": profile_username,
            },
            "raw_text": full_text
        }
    else:
        reasons = []
        if not id_matches:
            reasons.append(
                f'In-game ID "{profile_id}" not found in screenshot (detected: {detected_ids})'
            )
        if not username_matches:
            reasons.append(
                f'Username "{profile_username}" not found in screenshot'
            )

        return {
            "success": False,
            "status": "unverified",
            "message": f"Verification failed: {'; '.join(reasons)}.",
            "show_badge": False,
            "extracted": {
                "detected_ids": detected_ids,
                "detected_lines": extracted_lines,
            },
            "raw_text": full_text
        }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

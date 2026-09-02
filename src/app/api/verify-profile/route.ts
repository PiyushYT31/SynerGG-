import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route that forwards verification requests to the Python EasyOCR microservice.
 *
 * Frontend contract remains unchanged:
 *   POST { base64Image, profileIgn, profileUid }
 *
 * This route converts the base64 image to a binary blob and sends it as
 * multipart/form-data to the Python FastAPI service at localhost:8000.
 */

const VERIFY_SERVICE_URL =
    process.env.VERIFY_SERVICE_URL || "http://localhost:8000/api/profile/verify-id";

export async function POST(req: NextRequest) {
    try {
        const { base64Image, profileIgn, profileUid } = await req.json();

        if (!base64Image || !profileIgn || !profileUid) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------
        // Convert base64 data URL → binary Blob for multipart upload
        // ---------------------------------------------------------------
        const base64Match = base64Image.match(
            /^data:image\/([\w+]+);base64,(.+)$/
        );

        let mimeType = "image/jpeg";
        let pureBase64 = base64Image;

        if (base64Match) {
            mimeType = `image/${base64Match[1]}`;
            pureBase64 = base64Match[2];
        }

        const binaryData = Buffer.from(pureBase64, "base64");
        const blob = new Blob([binaryData], { type: mimeType });

        // Determine file extension
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

        // ---------------------------------------------------------------
        // Build multipart/form-data and forward to Python service
        // ---------------------------------------------------------------
        const formData = new FormData();
        formData.append("file", blob, `screenshot.${ext}`);
        formData.append("profile_id", profileUid);
        formData.append("profile_username", profileIgn);

        let serviceResponse: Response;
        try {
            serviceResponse = await fetch(VERIFY_SERVICE_URL, {
                method: "POST",
                body: formData,
            });
        } catch (fetchError: any) {
            console.error("Failed to reach verification service:", fetchError.message);
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Verification service is unavailable. Make sure the Python server is running.",
                },
                { status: 503 }
            );
        }

        const result = await serviceResponse.json();
        console.log("Verification service response:", result);

        // ---------------------------------------------------------------
        // Translate Python service response to frontend contract
        // ---------------------------------------------------------------
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message || "Profile verified successfully!",
                extracted: result.extracted || { ign: profileIgn, uid: profileUid },
                raw_text: result.raw_text || "",
                verification_status: "verified",
                show_badge: true,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.message || "Verification failed.",
                extracted: result.extracted || null,
                raw_text: result.raw_text || "",
                verification_status: "unverified",
                show_badge: false,
            });
        }
    } catch (error: any) {
        console.error("Verification API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Server error during verification",
            },
            { status: 500 }
        );
    }
}

# Team Logo Upload Guide

This guide explains how to upload real BGMI esports team logos to Firebase Storage and associate them with organizations in Firestore.

## How It Works

```
Your local logo files
      ↓
scripts/upload-logos.mjs
      ↓
Firebase Storage  →  org-logos/<filename>
      ↓
Firestore  →  organization_profiles/<org-id>  { name, logoUrl }
      ↓
Homepage carousel fetches logoUrl in real-time via Firestore listener
```

## Prerequisites

### 1. Firebase Service Account Key

You need a **Service Account** JSON key for the Firebase project `studio-2116590225-e0a63`.

**To get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → Select project `studio-2116590225-e0a63`
2. Click ⚙️ (Settings) → **Project settings** → **Service accounts** tab
3. Click **Generate new private key** → **Generate key**
4. Save the downloaded JSON file somewhere safe (e.g. `serviceAccount.json` in the project root)

> ⚠️ **NEVER commit `serviceAccount.json` to Git.** It's already in `.gitignore`.

### 2. Logo Image Files

Prepare a folder with your team logo images. Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`

**File naming convention** — the script converts filenames to org names automatically:
| Filename | Org Name (auto-generated) |
|----------|--------------------------|
| `godlike-esports.png` | Godlike Esports |
| `team_xspark.png` | Team Xspark |
| `iQOO-soul.webp` | IQOO Soul |
| `8bit.png` | 8Bit |

---

## Run the Upload Script

```powershell
# Method 1: Recommended — specify both logos dir and service account
npm run upload-logos -- --logos-dir="C:\path\to\logos" --service-account=".\serviceAccount.json"

# Method 2: Using GOOGLE_APPLICATION_CREDENTIALS env var
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
npm run upload-logos -- --logos-dir="C:\path\to\logos"

# Example with actual paths
npm run upload-logos -- --logos-dir="C:\Users\hanum\Downloads\logos" --service-account=".\serviceAccount.json"
```

### What The Script Does

For each image file in the logos directory:
1. **Uploads** the image to Firebase Storage at path `org-logos/<filename>`
2. **Creates/updates** a Firestore document in `organization_profiles` collection:
   - Document ID: derived from filename (e.g. `godlike-esports`)
   - Fields set: `name`, `logoUrl`, `isVerified: false`, `createdAt`, `updatedAt`
   - Uses `{ merge: true }` — safe to re-run; won't overwrite existing rich profile data

### Example Output

```
📂  Reading logos from: C:\Users\hanum\Downloads\logos

🖼️   Found 3 image(s):
  godlike-esports.png
  team-xspark.png
  soul-esports.webp

⬆️   Uploading "godlike-esports.png" as "Godlike Esports"... ✅  Done → https://firebasestorage.googleapis.com/...
⬆️   Uploading "team-xspark.png" as "Team Xspark"... ✅  Done → https://firebasestorage.googleapis.com/...
⬆️   Uploading "soul-esports.webp" as "Soul Esports"... ✅  Done → https://firebasestorage.googleapis.com/...

─────────────────────────────────────────────
✅  Upload complete! 3/3 logos processed.
─────────────────────────────────────────────
```

---

## After Upload

Once logos are uploaded, the homepage carousel will **automatically update** — no code changes needed. The `OrgLogosCarousel` component listens to Firestore in real-time.

- If Firestore has org logos → displays them
- If Firestore is empty → falls back to placeholder images
- While loading → shows skeleton animation

---

## Firebase Storage Rules (Important)

Make sure your Firebase Storage rules allow **public reads** for the `org-logos/` prefix.

In the Firebase Console → Storage → Rules, ensure you have:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to org logos
    match /org-logos/{file} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // All other paths require auth
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Cannot read directory` | Check the `--logos-dir` path exists and has images |
| `Permission denied` | Verify service account has Storage Admin + Firestore Admin roles |
| `STORAGE_BUCKET` error | Ensure Firebase Storage is enabled in your project |
| Images show broken in carousel | Check `next.config.ts` has `firebasestorage.googleapis.com` in `remotePatterns` ✅ |

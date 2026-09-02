/**
 * BGMI Synergy Connect — Team Logo Upload Script
 * -----------------------------------------------
 * Usage:
 *   node scripts/upload-logos.mjs --logos-dir="C:\path\to\logos"
 *
 * This script:
 *  1. Reads all image files from the specified directory.
 *  2. Uploads each file to Firebase Storage under `org-logos/<filename>`.
 *  3. Writes/updates a document in Firestore `organization_profiles` with:
 *       - name: (derived from filename, without extension)
 *       - logoUrl: (public download URL from Firebase Storage)
 *       - isVerified: false
 *       - createdAt / updatedAt: ISO timestamp
 *
 * Prerequisites:
 *   npm install firebase-admin --save-dev
 *   Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path,
 *   OR pass --service-account="path/to/serviceAccount.json"
 *
 * Examples:
 *   node scripts/upload-logos.mjs --logos-dir="./logos"
 *   node scripts/upload-logos.mjs --logos-dir="C:\Users\hanum\Downloads\logos" --service-account="./serviceAccount.json"
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readdir, readFile } from 'fs/promises';
import { extname, basename, resolve } from 'path';
import { createReadStream } from 'fs';

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  acc[key] = rest.join('=');
  return acc;
}, {});

const LOGOS_DIR = args['logos-dir'];
const SERVICE_ACCOUNT_PATH = args['service-account'] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!LOGOS_DIR) {
  console.error('❌  Please provide --logos-dir="path/to/logos"');
  process.exit(1);
}

// ─── Firebase Config (matches src/firebase/config.ts) ────────────────────────
const PROJECT_ID = 'studio-2116590225-e0a63';
const STORAGE_BUCKET = `${PROJECT_ID}.appspot.com`;

// ─── Initialize Firebase Admin ───────────────────────────────────────────────
if (!getApps().length) {
  if (SERVICE_ACCOUNT_PATH) {
    const sa = JSON.parse(await readFile(resolve(SERVICE_ACCOUNT_PATH), 'utf-8'));
    initializeApp({ credential: cert(sa), storageBucket: STORAGE_BUCKET });
    console.log('✅  Initialized Firebase Admin with service account.');
  } else {
    // Application Default Credentials (ADC)
    initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
    console.log('✅  Initialized Firebase Admin with Application Default Credentials.');
  }
}

const db = getFirestore();
const bucket = getStorage().bucket();

// ─── Supported image extensions ──────────────────────────────────────────────
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Convert a filename like "godlike-esports.png" → "Godlike Esports" */
function filenameToOrgName(filename) {
  return basename(filename, extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Upload a file to Firebase Storage and return the public URL */
async function uploadToStorage(localPath, destPath, contentType) {
  const fileRef = bucket.file(destPath);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType },
    public: true,
  });
  const [metadata] = await fileRef.getMetadata();
  // Construct a public URL
  const encodedPath = encodeURIComponent(destPath);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
}

/** Get MIME type from extension */
function mimeType(ext) {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const absLogosDir = resolve(LOGOS_DIR);
  console.log(`\n📂  Reading logos from: ${absLogosDir}\n`);

  let files;
  try {
    files = await readdir(absLogosDir);
  } catch (e) {
    console.error(`❌  Cannot read directory: ${absLogosDir}\n`, e.message);
    process.exit(1);
  }

  const imageFiles = files.filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));

  if (imageFiles.length === 0) {
    console.warn('⚠️   No image files found in the directory. Supported: .png .jpg .jpeg .webp .svg .gif');
    process.exit(0);
  }

  console.log(`🖼️   Found ${imageFiles.length} image(s):\n  ${imageFiles.join('\n  ')}\n`);

  const now = new Date().toISOString();
  const results = [];

  for (const file of imageFiles) {
    const ext = extname(file).toLowerCase();
    const orgName = filenameToOrgName(file);
    const storagePath = `org-logos/${file}`;
    const localPath = `${absLogosDir}/${file}`;

    process.stdout.write(`⬆️   Uploading "${file}" as "${orgName}"... `);

    try {
      const logoUrl = await uploadToStorage(localPath, storagePath, mimeType(ext));

      // Use the filename (without ext) as Firestore doc ID for idempotency
      const docId = basename(file, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const docRef = db.collection('organization_profiles').doc(docId);

      await docRef.set(
        {
          name: orgName,
          logoUrl,
          isVerified: false,
          userId: 'system', // placeholder — will be overwritten when org signs up
          email: '',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true } // won't overwrite existing rich profile data
      );

      console.log(`✅  Done → ${logoUrl}`);
      results.push({ orgName, logoUrl, docId });
    } catch (err) {
      console.log(`❌  FAILED`);
      console.error(`    Error: ${err.message}`);
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅  Upload complete! ${results.length}/${imageFiles.length} logos processed.`);
  console.log('─────────────────────────────────────────────\n');
  console.log('Results:');
  results.forEach(({ orgName, logoUrl, docId }) => {
    console.log(`  [${docId}] ${orgName}`);
    console.log(`    ${logoUrl}`);
  });
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err);
  process.exit(1);
});

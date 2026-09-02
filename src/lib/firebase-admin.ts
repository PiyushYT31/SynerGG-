import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// For server-side usage in Next.js Server Actions
function initAdmin() {
    if (getApps().length > 0) {
        return getApp();
    }

    // In Firebase App Hosting, environment variables are automatically populated
    // If not, we use fallback to config
    return initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
}

const adminApp = initAdmin();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);

'use server';

import { extractProfileDataSdk } from '@/ai/ocr-sdk';

export async function verifyPlayerProfile(playerId: string, base64Image: string, profileIgn: string, profileUid: string) {
    try {
        // 2. Extract data from image using SDK
        // Remove data:image/jpeg;base64, if present
        const pureBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const extracted = await extractProfileDataSdk(pureBase64);

        console.log('AI Extracted Data:', extracted);

        if (!extracted || !extracted.ign || !extracted.uid) {
            return { success: false, error: 'AI failed to find IGN or UID in the screenshot. Please try again with a clearer image.' };
        }

        // Compare data
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        
        const normProfileIgn = normalize(profileIgn);
        const normExtractedIgn = normalize(extracted.ign);
        
        // UID comparison (numeric only)
        const normProfileUid = profileUid.replace(/[^0-9]/g, '');
        const normExtractedUid = extracted.uid.replace(/[^0-9]/g, '');

        const ignMatches = normProfileIgn === normExtractedIgn || (normProfileIgn.length > 3 && (normExtractedIgn.includes(normProfileIgn) || normProfileIgn.includes(normExtractedIgn)));
        const uidMatches = normProfileUid === normExtractedUid;

        if (ignMatches && uidMatches) {
            return { 
                success: true, 
                message: 'Information matched! Completing verification...',
                extracted: { ign: extracted.ign, uid: extracted.uid },
                pureBase64: pureBase64 // Returning this for client-side upload if needed, or just let client handle it
            };
        } else {
            let errorMsg = 'Verification failed: Information mismatch. ';
            if (!ignMatches) errorMsg += `Expected IGN "${profileIgn}" but found "${extracted.ign}". `;
            if (!uidMatches) errorMsg += `Expected UID "${profileUid}" but found "${extracted.uid}". `;
            
            return { 
                success: false, 
                error: errorMsg,
                extracted: { ign: extracted.ign, uid: extracted.uid }
            };
        }
    } catch (error: any) {
        console.error('Verification error:', error);
        return { success: false, error: error.message || 'An error occurred during verification' };
    }
}

// src/lib/storageService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Handles Firebase Storage uploads (proof-of-work photos/PDFs).
// Firebase Storage replaces any local file storage that would have existed
// in the Express backend.
//
// FIREBASE STORAGE RULES to paste in Firebase Console → Storage → Rules:
//
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /proofs/{userId}/{allPaths=**} {
//       allow read: if request.auth != null;
//       allow write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"

/**
 * Uploads a proof-of-work file to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadProofFile(
    file: File,
    workerUid: string
): Promise<string> {
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storageRef = ref(storage, `proofs/${workerUid}/${timestamp}_${safeName}`)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
}
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"

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

export async function uploadSurveyImage(
    folderId: string,
    base64Image: string,
    fileName: string,
): Promise<string> {
    const timestamp = Date.now()
    const safeName = (fileName || `survey-${timestamp}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_")

    const binaryString = atob(base64Image)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

    const storageRef = ref(storage, `surveys/${folderId}/${timestamp}_${safeName}`)
    const snapshot = await uploadBytes(storageRef, bytes, { contentType: "image/jpeg" })
    return await getDownloadURL(snapshot.ref)
}
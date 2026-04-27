// src/lib/surveyService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firestore operations for Survey Analysis feature.
// Collections:
//   surveyFolders/{folderId}                  — folder metadata
//   surveyFolders/{folderId}/documents/{docId} — uploaded documents
// ─────────────────────────────────────────────────────────────────────────────

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SurveyFolder {
    id: string
    uniqueId: string          // randomly generated e.g. "SRV-A3F9K2"
    ngoId: string
    state: string
    district: string
    subDistrict: string
    block: string
    wardNo: string
    createdAt: Timestamp | null
    documentCount: number
}

export type DocumentStatus = "not started" | "active" | "completed"

export interface SurveyDocument {
    id: string
    folderId: string
    name: string
    fileURL: string
    fileType: string          // mime type
    status: DocumentStatus
    priorityRank: number | null   // null until AI ranks it
    priorityReason: string | null // AI explanation
    uploadedAt: Timestamp | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateUniqueId(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let id = "SRV-"
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
}

// ── Survey Folders ────────────────────────────────────────────────────────────

export async function createSurveyFolder(
    ngoId: string,
    data: {
        state: string
        district: string
        subDistrict: string
        block: string
        wardNo: string
    }
): Promise<string> {
    const uniqueId = generateUniqueId()
    const ref = await addDoc(collection(db, "surveyFolders"), {
        uniqueId,
        ngoId,
        ...data,
        documentCount: 0,
        createdAt: serverTimestamp(),
    })
    return ref.id
}

export async function fetchNGOSurveyFolders(ngoId: string): Promise<SurveyFolder[]> {
    const q = query(
        collection(db, "surveyFolders"),
        where("ngoId", "==", ngoId)
    )
    const snap = await getDocs(q)
    const folders = snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyFolder))
    return folders.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0
        const bTime = b.createdAt?.toMillis() ?? 0
        return bTime - aTime
    })
}

export async function fetchSurveyFolder(folderId: string): Promise<SurveyFolder | null> {
    const snap = await getDoc(doc(db, "surveyFolders", folderId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as SurveyFolder
}

export async function deleteSurveyFolder(folderId: string): Promise<void> {
    await deleteDoc(doc(db, "surveyFolders", folderId))
}

// ── Survey Documents ──────────────────────────────────────────────────────────

export async function addSurveyDocument(
    folderId: string,
    data: {
        name: string
        fileURL: string
        fileType: string
    }
): Promise<string> {
    const ref = await addDoc(
        collection(db, "surveyFolders", folderId, "documents"),
        {
            folderId,
            name: data.name,
            fileURL: data.fileURL,
            fileType: data.fileType,
            status: "not started" as DocumentStatus,
            priorityRank: null,
            priorityReason: null,
            uploadedAt: serverTimestamp(),
        }
    )

    // Increment folder's documentCount
    const folderRef = doc(db, "surveyFolders", folderId)
    const folderSnap = await getDoc(folderRef)
    if (folderSnap.exists()) {
        await updateDoc(folderRef, {
            documentCount: (folderSnap.data().documentCount || 0) + 1,
        })
    }

    return ref.id
}

export async function fetchSurveyDocuments(folderId: string): Promise<SurveyDocument[]> {
    const snap = await getDocs(
        collection(db, "surveyFolders", folderId, "documents")
    )
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyDocument))
    return docs.sort((a, b) => {
        // If ranked by AI, sort by rank; otherwise by upload time
        if (a.priorityRank !== null && b.priorityRank !== null) {
            return a.priorityRank - b.priorityRank
        }
        const aTime = a.uploadedAt?.toMillis() ?? 0
        const bTime = b.uploadedAt?.toMillis() ?? 0
        return bTime - aTime
    })
}

export async function updateDocumentStatus(
    folderId: string,
    docId: string,
    status: DocumentStatus
): Promise<void> {
    await updateDoc(
        doc(db, "surveyFolders", folderId, "documents", docId),
        { status }
    )
}

export async function updateDocumentPriority(
    folderId: string,
    docId: string,
    priorityRank: number,
    priorityReason: string
): Promise<void> {
    await updateDoc(
        doc(db, "surveyFolders", folderId, "documents", docId),
        { priorityRank, priorityReason }
    )
}

export async function deleteSurveyDocument(
    folderId: string,
    docId: string
): Promise<void> {
    await deleteDoc(doc(db, "surveyFolders", folderId, "documents", docId))
    const folderRef = doc(db, "surveyFolders", folderId)
    const folderSnap = await getDoc(folderRef)
    if (folderSnap.exists()) {
        const count = folderSnap.data().documentCount || 0
        await updateDoc(folderRef, { documentCount: Math.max(0, count - 1) })
    }
}
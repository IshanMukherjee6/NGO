// src/lib/surveyService.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES:
//   • addSurveyDocumentWithOCR() — takes base64 image, calls Gemini Vision
//     to OCR handwritten survey photo into structured data, saves to Firestore
//   • SurveyDocument now stores extractedData, problemType, location, emergencyLevel
//   • runFolderAIAnalysis() — reads all docs, uses Gemini to segregate into jobs
//     with status, urgency chart data, supporting doc count
//   • fetchSurveyFolderByUniqueId() — for surveyor room entry matching
//   • SurveyJobSuggestion type for AI analysis output
// ─────────────────────────────────────────────────────────────────────────────

import {
    collection, addDoc, getDocs, getDoc, updateDoc,
    deleteDoc, doc, query, where, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SurveyFolder {
    id: string
    uniqueId: string
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
export type EmergencyLevel = "low" | "medium" | "high" | "critical"

export interface ExtractedSurveyData {
    location: string
    problemType: string
    description: string
    affectedPeople: number | null
    emergencyLevel: EmergencyLevel
    recommendedAction: string
    rawText: string
}

export interface SurveyDocument {
    id: string
    folderId: string
    name: string
    fileURL: string           // kept for compatibility, will be empty string
    fileType: string
    status: DocumentStatus
    priorityRank: number | null
    priorityReason: string | null
    extractedData: ExtractedSurveyData | null   // OCR result
    uploadedAt: Timestamp | null
    uploadedBy?: string       // uid of surveyor
}

// Job suggestion from AI folder analysis
export type JobStatus = "ongoing" | "completed" | "not_published" | "not_started"

export interface SurveyJobSuggestion {
    id: string                // local ID for rendering
    problemType: string
    location: string
    supportingDocCount: number
    emergencyLevel: EmergencyLevel
    status: JobStatus
    description: string
    recommendedWorkers: number
    autoFillData: {           // pre-fills the Post Job form
        title: string
        department: string
        location: string
        experience: string
        education: string
        duration: string
    }
}

// ── Gemini helper ─────────────────────────────────────────────────────────────

async function callGeminiVision(prompt: string, base64Image?: string): Promise<string> {
    if (!GEMINI_KEY) throw new Error("VITE_GEMINI_API_KEY not set")

    const parts: object[] = [{ text: prompt }]
    if (base64Image) {
        parts.unshift({
            inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
            },
        })
    }

    const res = await fetch(GEMINI_VISION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
    })

    if (res.status === 429) throw new Error("Gemini rate limit — try again in 1 minute")
    if (!res.ok) {
        const err = await res.text().catch(() => "")
        throw new Error(`Gemini error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
}

// ── OCR Survey Upload ─────────────────────────────────────────────────────────
// Takes a base64 JPEG of a handwritten survey form.
// Gemini Vision reads it and returns structured data.
// Nothing is stored in Firebase Storage — only the structured text is saved.

export async function addSurveyDocumentWithOCR(
    folderId: string,
    folderMeta: { state: string; district: string; block: string; wardNo: string },
    base64Image: string,
    uploaderUid: string,
    fileName: string,
): Promise<{ docId: string; extracted: ExtractedSurveyData }> {

    const prompt = `You are an OCR system for an Indian NGO field survey platform.
The image is a handwritten survey form from a field worker in ${folderMeta.state}, ${folderMeta.district}, Block: ${folderMeta.block}, Ward: ${folderMeta.wardNo}.

Extract ALL text from the image and convert it into structured data.
If the image is unclear, do your best to interpret the handwriting.

Return ONLY this JSON (no explanation):
{
  "location": "<specific location mentioned in survey, or '${folderMeta.district}, ${folderMeta.state}' if not mentioned>",
  "problemType": "<one of: Healthcare, Education, Sanitation, Food Security, Infrastructure, Natural Disaster, Women Safety, Child Welfare, Other>",
  "description": "<full description of the problem in 2-3 sentences from the survey>",
  "affectedPeople": <number or null if not mentioned>,
  "emergencyLevel": "<one of: low, medium, high, critical>",
  "recommendedAction": "<what the surveyor recommends should be done>",
  "rawText": "<all text extracted from the image verbatim>"
}`

    let extracted: ExtractedSurveyData

    try {
        const raw = await callGeminiVision(prompt, base64Image)
        const parsed = JSON.parse(raw)
        extracted = {
            location: parsed.location || `${folderMeta.district}, ${folderMeta.state}`,
            problemType: parsed.problemType || "Other",
            description: parsed.description || "Could not extract description",
            affectedPeople: parsed.affectedPeople ?? null,
            emergencyLevel: (parsed.emergencyLevel as EmergencyLevel) || "medium",
            recommendedAction: parsed.recommendedAction || "",
            rawText: parsed.rawText || "",
        }
    } catch (err) {
        console.error("OCR failed:", err)
        // Fallback — save with placeholder data so upload doesn't fail
        extracted = {
            location: `${folderMeta.district}, ${folderMeta.state}`,
            problemType: "Other",
            description: "OCR failed — please re-upload or enter data manually",
            affectedPeople: null,
            emergencyLevel: "medium",
            recommendedAction: "",
            rawText: "OCR unavailable",
        }
    }

    const ref = await addDoc(
        collection(db, "surveyFolders", folderId, "documents"),
        {
            folderId,
            name: fileName,
            fileURL: "",          // no file stored — text only
            fileType: "image/jpeg",
            status: "not started" as DocumentStatus,
            priorityRank: null,
            priorityReason: null,
            extractedData: extracted,
            uploadedAt: serverTimestamp(),
            uploadedBy: uploaderUid,
        }
    )

    // Increment documentCount
    const folderRef = doc(db, "surveyFolders", folderId)
    const folderSnap = await getDoc(folderRef)
    if (folderSnap.exists()) {
        await updateDoc(folderRef, {
            documentCount: (folderSnap.data().documentCount || 0) + 1,
        })
    }

    return { docId: ref.id, extracted }
}

// ── AI Folder Analysis ────────────────────────────────────────────────────────
// Called by NGO Official when pressing "AI Analysis" button on a folder.
// Reads all survey documents and produces a job suggestion table.

export async function runFolderAIAnalysis(
    folderId: string,
    existingJobTitles: string[] = [],   // jobs already published by this NGO
): Promise<SurveyJobSuggestion[]> {

    const docsSnap = await getDocs(
        collection(db, "surveyFolders", folderId, "documents")
    )
    const docs = docsSnap.docs.map(d => d.data())

    if (docs.length === 0) throw new Error("No survey documents found in this folder")

    // Build a summary of all extracted data
    const summaries = docs.map((d, i) => {
        const e = d.extractedData as ExtractedSurveyData | null
        if (!e) return `Survey ${i + 1}: No data extracted`
        return `Survey ${i + 1}: Problem="${e.problemType}" Location="${e.location}" Emergency="${e.emergencyLevel}" Affected=${e.affectedPeople ?? "unknown"} Description="${e.description}"`
    }).join("\n")

    const prompt = `You are an AI analyst for an Indian NGO platform.
Below are ${docs.length} field survey records from this folder.
Already published job titles by this NGO: ${existingJobTitles.length > 0 ? existingJobTitles.join(", ") : "none"}

SURVEYS:
${summaries}

Group similar surveys into distinct PROBLEMS/JOBS.
For each group, determine:
- How many surveys support this problem (supportingDocCount)
- The most urgent emergency level across those surveys
- Whether a job is already published (check against existing job titles), ongoing, completed, or not started

Job Status Rules:
- "ongoing": a matching job title exists in published jobs AND has active workers
- "completed": a matching job exists and is marked closed
- "not_published": no matching job has been published yet
- "not_started": a job is published but has 0 accepted workers

Return ONLY a JSON array (no explanation):
[
  {
    "problemType": "<problem category>",
    "location": "<most common location from surveys>",
    "supportingDocCount": <number>,
    "emergencyLevel": "<low|medium|high|critical>",
    "status": "<ongoing|completed|not_published|not_started>",
    "description": "<2 sentence summary of the problem>",
    "recommendedWorkers": <estimated workers needed>,
    "autoFillData": {
      "title": "<suggested job title>",
      "department": "<Operations|Health|Training|Admin|Finance|Research>",
      "location": "<location string>",
      "experience": "<Fresher|0-1 years|1-2 years|2-3 years|3-5 years|5+ years>",
      "education": "<8th Pass|10th Pass|12th Pass|Graduate|Post Graduate>",
      "duration": "<1 month|2 months|3 months|6 months|1 year|Ongoing>"
    }
  }
]`

    try {
        const raw = await callGeminiVision(prompt)
        const parsed: Omit<SurveyJobSuggestion, "id">[] = JSON.parse(raw)
        return parsed.map((item, i) => ({
            ...item,
            id: `suggestion-${i}`,
        }))
    } catch (err) {
        console.error("AI folder analysis failed:", err)
        throw new Error("AI analysis failed. Check your Gemini API key and quota.")
    }
}

// ── Folder CRUD ───────────────────────────────────────────────────────────────

function generateUniqueId(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let id = "SRV-"
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
    return id
}

export async function createSurveyFolder(
    ngoId: string,
    data: { state: string; district: string; subDistrict: string; block: string; wardNo: string }
): Promise<string> {
    const uniqueId = generateUniqueId()
    const ref = await addDoc(collection(db, "surveyFolders"), {
        uniqueId, ngoId, ...data,
        documentCount: 0,
        createdAt: serverTimestamp(),
    })
    return ref.id
}

export async function fetchNGOSurveyFolders(ngoId: string): Promise<SurveyFolder[]> {
    const snap = await getDocs(query(collection(db, "surveyFolders"), where("ngoId", "==", ngoId)))
    const folders = snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyFolder))
    return folders.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
}

export async function fetchSurveyFolder(folderId: string): Promise<SurveyFolder | null> {
    const snap = await getDoc(doc(db, "surveyFolders", folderId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as SurveyFolder
}

// For surveyor room entry — match by uniqueId string
export async function fetchSurveyFolderByUniqueId(uniqueId: string): Promise<SurveyFolder | null> {
    const snap = await getDocs(query(
        collection(db, "surveyFolders"),
        where("uniqueId", "==", uniqueId.trim().toUpperCase())
    ))
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as SurveyFolder
}

export async function deleteSurveyFolder(folderId: string): Promise<void> {
    await deleteDoc(doc(db, "surveyFolders", folderId))
}

// ── Document CRUD ─────────────────────────────────────────────────────────────

export async function fetchSurveyDocuments(folderId: string): Promise<SurveyDocument[]> {
    const snap = await getDocs(collection(db, "surveyFolders", folderId, "documents"))
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyDocument))
    return docs.sort((a, b) => {
        if (a.priorityRank !== null && b.priorityRank !== null) return a.priorityRank - b.priorityRank
        return (b.uploadedAt?.toMillis() ?? 0) - (a.uploadedAt?.toMillis() ?? 0)
    })
}

export async function updateDocumentStatus(folderId: string, docId: string, status: DocumentStatus): Promise<void> {
    await updateDoc(doc(db, "surveyFolders", folderId, "documents", docId), { status })
}

export async function updateDocumentPriority(folderId: string, docId: string, priorityRank: number, priorityReason: string): Promise<void> {
    await updateDoc(doc(db, "surveyFolders", folderId, "documents", docId), { priorityRank, priorityReason })
}

export async function deleteSurveyDocument(folderId: string, docId: string): Promise<void> {
    await deleteDoc(doc(db, "surveyFolders", folderId, "documents", docId))
    const folderRef = doc(db, "surveyFolders", folderId)
    const folderSnap = await getDoc(folderRef)
    if (folderSnap.exists()) {
        await updateDoc(folderRef, { documentCount: Math.max(0, (folderSnap.data().documentCount || 0) - 1) })
    }
}
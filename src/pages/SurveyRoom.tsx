// src/pages/SurveyRoom.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MERGED VERSION
// - Keeps original OCR upload flow
// - Adds Firebase Storage backup (recoverable images)
// - Adds OCR status handling (success/failure)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Loader2, Camera, Upload, CheckCircle, X,
    ClipboardList, MapPin, AlertTriangle,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
    fetchSurveyFolderByUniqueId,
    addSurveyDocumentWithOCR,
    fetchSurveyDocuments,
    type SurveyFolder,
    type SurveyDocument,
    type EmergencyLevel,
} from "../lib/surveyService"

// ✅ NEW (from 2nd file)
import { uploadSurveyImage } from "../lib/storageService"

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"

const emergencyColors: Record<EmergencyLevel, string> = {
    low: "text-green-500 bg-green-500/10 border-green-500/20",
    medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    critical: "text-red-500 bg-red-500/10 border-red-500/20",
}

// ── Step 1: Room Entry ────────────────────────────────────────────────────────

function RoomEntry({ onEnter }: { onEnter: (folder: SurveyFolder) => void }) {
    const { showToast } = useToast()
    const [roomId, setRoomId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleEnter = async () => {
        if (!roomId.trim()) { setError("Please enter a room ID."); return }
        setError("")
        setLoading(true)
        try {
            const folder = await fetchSurveyFolderByUniqueId(roomId.trim())
            if (!folder) {
                setError("No survey room found with this ID.")
                return
            }
            onEnter(folder)
        } catch {
            setError("Failed to connect. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <ClipboardList className="mx-auto mb-4 text-violet-400" size={28} />
                    <h1 className="text-2xl font-bold">Enter Survey Room</h1>
                </div>

                <input
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    placeholder="SRV-XXXXXX"
                    onKeyDown={e => e.key === "Enter" && handleEnter()}
                    className={`${inputCls} text-center`}
                />

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <Button onClick={handleEnter} disabled={loading} className="w-full mt-4">
                    {loading ? <Loader2 className="animate-spin" /> : "Enter"}
                </Button>
            </div>
        </div>
    )
}

// ── Step 2: Upload Interface ──────────────────────────────────────────────────

function UploadInterface({ folder }: { folder: SurveyFolder }) {
    const { currentUser } = useAuth()
    const { showToast } = useToast()
    const fileRef = useRef<HTMLInputElement>(null)

    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [base64, setBase64] = useState<string | null>(null)
    const [fileName, setFileName] = useState("")
    const [uploadedDocs, setUploadedDocs] = useState<SurveyDocument[]>([])
    const [loadingDocs, setLoadingDocs] = useState(true)
    const [lastUploaded, setLastUploaded] = useState<SurveyDocument | null>(null)

    useEffect(() => {
        fetchSurveyDocuments(folder.id)
            .then(setUploadedDocs)
            .finally(() => setLoadingDocs(false))
    }, [folder.id])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            showToast("Only images allowed", "error")
            return
        }

        setFileName(file.name)

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setPreview(result)
            setBase64(result.split(",")[1])
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!base64 || !currentUser) return

        setUploading(true)
        try {
            // ✅ NEW: upload image first
            const fileURL = await uploadSurveyImage(folder.id, base64, fileName)

            const { docId, extracted, ocrStatus } = await addSurveyDocumentWithOCR(
                folder.id,
                {
                    state: folder.state,
                    district: folder.district,
                    block: folder.block,
                    wardNo: folder.wardNo,
                },
                base64,
                currentUser.uid,
                fileName,
                fileURL
            )

            const newDoc: SurveyDocument = {
                id: docId,
                folderId: folder.id,
                name: fileName,
                fileURL,
                fileType: "image/jpeg",
                status: "not started",
                priorityRank: null,
                priorityReason: null,
                extractedData: extracted,
                uploadedAt: null,
                // @ts-ignore (safe fallback if type not updated)
                ocrStatus,
            }

            setUploadedDocs(prev => [newDoc, ...prev])
            setLastUploaded(newDoc)

            setPreview(null)
            setBase64(null)
            setFileName("")
            if (fileRef.current) fileRef.current.value = ""

            // ✅ NEW: better feedback
            if (ocrStatus === "ok" || !ocrStatus) {
                showToast("Survey processed successfully!", "success")
            } else {
                showToast("OCR failed. Image saved for retry.", "error")
            }

        } catch (err) {
            showToast("Upload failed", "error")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">

            {/* Upload */}
            {!preview ? (
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
            ) : (
                <>
                    <img src={preview} className="max-h-60" />
                    <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Processing..." : "Upload"}
                    </Button>
                </>
            )}

            {/* Last uploaded */}
            {lastUploaded?.extractedData && (
                <div className="mt-6 border p-4 rounded">
                    <CheckCircle className="text-green-500" />
                    <p>{lastUploaded.extractedData.problemType}</p>
                </div>
            )}

            {/* List */}
            <div className="mt-6">
                {uploadedDocs.map(d => (
                    <div key={d.id} className="border p-3 mb-2 rounded">
                        <p>{d.name}</p>
                        {d.extractedData && <p>{d.extractedData.problemType}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SurveyRoom() {
    const [folder, setFolder] = useState<SurveyFolder | null>(null)

    if (!folder) return <RoomEntry onEnter={setFolder} />
    return <UploadInterface folder={folder} />
}
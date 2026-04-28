// src/pages/SurveyRoom.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NEW PAGE — for NGO Surveyors only.
// Step 1: Enter survey room unique ID (e.g. SRV-A3F9K2)
// Step 2: If ID matches a folder → show upload interface
//         Surveyor can take a photo of handwritten survey and upload
//         Gemini OCR converts it to structured text (no file stored)
//         No AI Assistant button shown to surveyor
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Loader2, Camera, Upload, CheckCircle, X, ArrowLeft,
    ClipboardList, MapPin, AlertTriangle, Eye,
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
                setError("No survey room found with this ID. Please check and try again.")
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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                        <ClipboardList size={28} className="text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Enter Survey Room</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Enter the unique room ID provided by your NGO official to access the survey folder.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            Room Unique ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={roomId}
                            onChange={e => setRoomId(e.target.value.toUpperCase())}
                            placeholder="e.g. SRV-A3F9K2"
                            onKeyDown={e => e.key === "Enter" && handleEnter()}
                            className={`${inputCls} font-mono tracking-widest text-center text-lg`}
                        />
                        <p className="text-xs text-muted-foreground text-center">Format: SRV-XXXXXX</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <Button onClick={handleEnter} disabled={loading} className="rounded-full h-11 font-semibold">
                        {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Connecting...</> : "Enter Room →"}
                    </Button>
                </div>
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

    // ✅ FIXED: was incorrectly using useState(() => { ... }) instead of useEffect
    useEffect(() => {
        fetchSurveyDocuments(folder.id)
            .then(setUploadedDocs)
            .catch(() => {})
            .finally(() => setLoadingDocs(false))
    }, [folder.id])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file (JPG, PNG)", "error"); return
        }
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setPreview(result)
            // Strip the data:image/jpeg;base64, prefix for Gemini
            setBase64(result.split(",")[1])
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!base64 || !currentUser) return
        setUploading(true)
        try {
            const { docId, extracted } = await addSurveyDocumentWithOCR(
                folder.id,
                { state: folder.state, district: folder.district, block: folder.block, wardNo: folder.wardNo },
                base64,
                currentUser.uid,
                fileName || `survey-${Date.now()}.jpg`,
            )

            const newDoc: SurveyDocument = {
                id: docId,
                folderId: folder.id,
                name: fileName,
                fileURL: "",
                fileType: "image/jpeg",
                status: "not started",
                priorityRank: null,
                priorityReason: null,
                extractedData: extracted,
                uploadedAt: null,
            }

            setUploadedDocs(prev => [newDoc, ...prev])
            setLastUploaded(newDoc)
            setPreview(null)
            setBase64(null)
            setFileName("")
            if (fileRef.current) fileRef.current.value = ""
            showToast("Survey uploaded and processed successfully!", "success")
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed"
            showToast(msg, "error")
        } finally {
            setUploading(false)
        }
    }

    const clearPreview = () => {
        setPreview(null); setBase64(null); setFileName("")
        if (fileRef.current) fileRef.current.value = ""
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <ClipboardList size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-mono">{folder.uniqueId}</p>
                        <h1 className="text-xl font-bold text-foreground">{folder.state} — {folder.district}</h1>
                    </div>
                </div>

                {/* Location info */}
                <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MapPin size={13} />{folder.subDistrict}</span>
                    <span>Block: <span className="text-foreground font-medium">{folder.block}</span></span>
                    <span>Ward: <span className="text-foreground font-medium">{folder.wardNo}</span></span>
                    <span className="ml-auto text-xs font-medium text-violet-400">
                        {uploadedDocs.length} survey{uploadedDocs.length !== 1 ? "s" : ""} uploaded
                    </span>
                </div>

                {/* Upload area */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Upload Survey Photo</h2>

                    {!preview ? (
                        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl py-12 cursor-pointer hover:border-muted-foreground transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                <Camera size={22} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">Take or upload a photo of your survey</p>
                                <p className="text-xs text-muted-foreground mt-1">JPG or PNG — the AI will read the handwriting</p>
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </label>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="relative rounded-2xl overflow-hidden border border-border">
                                <img src={preview} alt="Survey preview" className="w-full max-h-64 object-contain bg-muted" />
                                <button onClick={clearPreview}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">{fileName}</p>
                            <Button onClick={handleUpload} disabled={uploading} className="rounded-full h-11 font-semibold gap-2">
                                {uploading
                                    ? <><Loader2 size={16} className="animate-spin" />Processing with AI OCR...</>
                                    : <><Upload size={16} />Upload & Convert Survey</>}
                            </Button>
                            {uploading && (
                                <p className="text-xs text-muted-foreground text-center animate-pulse">
                                    Gemini is reading your handwritten survey... this may take a few seconds.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Last uploaded result */}
                {lastUploaded?.extractedData && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={16} className="text-green-500" />
                            <p className="text-sm font-semibold text-green-500">Survey processed successfully</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Problem Type</p>
                                <p className="font-medium text-foreground">{lastUploaded.extractedData.problemType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Location</p>
                                <p className="font-medium text-foreground">{lastUploaded.extractedData.location}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Emergency Level</p>
                                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${emergencyColors[lastUploaded.extractedData.emergencyLevel]}`}>
                                    {lastUploaded.extractedData.emergencyLevel.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Affected People</p>
                                <p className="font-medium text-foreground">{lastUploaded.extractedData.affectedPeople ?? "Not mentioned"}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{lastUploaded.extractedData.description}</p>
                    </div>
                )}

                {/* Uploaded surveys list */}
                <div>
                    <h2 className="text-base font-semibold text-foreground mb-3">
                        Uploaded Surveys ({uploadedDocs.length})
                    </h2>
                    {loadingDocs ? (
                        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
                    ) : uploadedDocs.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center">
                            <p className="text-sm text-muted-foreground">No surveys uploaded yet. Upload your first survey above.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {uploadedDocs.map(d => (
                                <div key={d.id} className="bg-card border border-border rounded-2xl p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{d.name || "Survey"}</p>
                                            {d.extractedData && (
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-muted-foreground">{d.extractedData.problemType}</span>
                                                    <span className="text-muted-foreground">·</span>
                                                    <span className="text-xs text-muted-foreground">{d.extractedData.location}</span>
                                                </div>
                                            )}
                                        </div>
                                        {d.extractedData && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${emergencyColors[d.extractedData.emergencyLevel]}`}>
                                                {d.extractedData.emergencyLevel}
                                            </span>
                                        )}
                                    </div>
                                    {d.extractedData?.description && (
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                                            {d.extractedData.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SurveyRoom() {
    const [folder, setFolder] = useState<SurveyFolder | null>(null)

    if (!folder) return <RoomEntry onEnter={setFolder} />
    return <UploadInterface folder={folder} />
}
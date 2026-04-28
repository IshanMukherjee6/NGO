// src/pages/SurveyFolder.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows documents inside a survey folder.
// Table: Name | Status | Priority Rank | Priority Reason
// "Upload Document" button → uploads to Firebase Storage → saves to Firestore.
// "AI Prioritise" button → calls Anthropic API to rank docs by urgency/importance.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
    fetchSurveyFolder,
    fetchSurveyDocuments,
    addSurveyDocumentWithOCR,
    updateDocumentStatus,
    updateDocumentPriority,
    deleteSurveyDocument,
    type SurveyFolder,
    type SurveyDocument,
    type DocumentStatus,
} from "../lib/surveyService"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft, Upload, Sparkles, Loader2, FileText,
    Trash2, ExternalLink, ChevronDown, MapPin,
    Hash, X, CheckCircle, AlertCircle,
} from "lucide-react"

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
    const map: Record<DocumentStatus, { label: string; cls: string }> = {
        "not started": {
            label: "Not Started",
            cls: "bg-muted text-muted-foreground border-border",
        },
        active: {
            label: "Active",
            cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        },
        completed: {
            label: "Completed",
            cls: "bg-green-500/10 text-green-500 border-green-500/20",
        },
    }
    const { label, cls } = map[status]
    return (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${cls}`}>
            {label}
        </span>
    )
}

// ── Status dropdown ────────────────────────────────────────────────────────────

function StatusDropdown({
    docId,
    folderId,
    current,
    onChange,
}: {
    docId: string
    folderId: string
    current: DocumentStatus
    onChange: (status: DocumentStatus) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const options: DocumentStatus[] = ["not started", "active", "completed"]

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
                <StatusBadge status={current} />
                <ChevronDown size={12} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={async () => {
                                await updateDocumentStatus(folderId, docId, opt)
                                onChange(opt)
                                setOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${opt === current ? "font-semibold" : ""}`}
                        >
                            <StatusBadge status={opt} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Upload Modal ───────────────────────────────────────────────────────────────

function UploadModal({
    folderId,
    folder,
    workerUid,
    onClose,
    onUploaded,
}: {
    folderId: string
    folder: SurveyFolder
    workerUid: string
    onClose: () => void
    onUploaded: () => void
}) {
    const { showToast } = useToast()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return
        setLoading(true)
        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve((reader.result as string).split(",")[1])
                reader.onerror = () => reject(new Error("Failed to read file"))
                reader.readAsDataURL(file)
            })

            await addSurveyDocumentWithOCR(
                folderId,
                {
                    state: folder.state,
                    district: folder.district,
                    block: folder.block,
                    wardNo: folder.wardNo,
                },
                base64,
                workerUid,
                file.name,
            )

            showToast("Document uploaded!", "success")
            setDone(true)
            onUploaded()
        } catch {
            showToast("Upload failed. Please try again.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Upload Document</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Add a file to this survey folder
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="px-7 py-6">
                    {done ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                                <CheckCircle size={28} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Uploaded!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {file?.name} has been added to this folder.
                                </p>
                            </div>
                            <Button onClick={onClose} className="rounded-full px-8 mt-2">Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <label
                                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 cursor-pointer transition-all ${file
                                    ? "border-foreground bg-muted/20"
                                    : "border-border hover:border-muted-foreground"
                                    }`}
                            >
                                <Upload
                                    size={28}
                                    className={file ? "text-foreground" : "text-muted-foreground"}
                                />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground">
                                        {file ? file.name : "Click to choose a file"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PDF, JPG, PNG, DOCX — up to 20 MB
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            <Button
                                type="submit"
                                disabled={!file || loading}
                                className="rounded-full h-11 font-semibold"
                            >
                                {loading
                                    ? <><Loader2 size={15} className="animate-spin mr-2" />Uploading...</>
                                    : "Upload Document"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── AI Prioritise Panel ────────────────────────────────────────────────────────

async function runAIPrioritisation(
    documents: SurveyDocument[],
    folderMeta: SurveyFolder
): Promise<{ id: string; rank: number; reason: string }[]> {
    const docList = documents
        .map((d, i) => `${i + 1}. Name: "${d.name}" | Type: ${d.fileType || "unknown"} | Status: ${d.status}`)
        .join("\n")

    const prompt = `You are an NGO field operations analyst. The following documents belong to a survey folder for:
State: ${folderMeta.state}, District: ${folderMeta.district}, Sub-district: ${folderMeta.subDistrict}, Block: ${folderMeta.block}, Ward: ${folderMeta.wardNo}.

Documents:
${docList}

Rank these documents from highest to lowest priority for review/action based on their names, types, and statuses. Consider urgency, compliance, and operational importance typical in NGO field surveys.

Respond ONLY with a valid JSON array (no markdown, no explanation outside JSON):
[
  { "index": 1, "rank": 1, "reason": "short reason why this is highest priority" },
  ...
]
Each object must have "index" (1-based, matching the list above), "rank" (1 = highest), and "reason" (max 15 words).`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
        }),
    })

    const data = await response.json()
    const text = data.content
        ?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("") ?? ""

    const clean = text.replace(/```json|```/g, "").trim()
    const parsed: { index: number; rank: number; reason: string }[] = JSON.parse(clean)

    return parsed.map(item => ({
        id: documents[item.index - 1].id,
        rank: item.rank,
        reason: item.reason,
    }))
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SurveyFolderPage() {
    const { folderId } = useParams<{ folderId: string }>()
    const { currentUser } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [folder, setFolder] = useState<SurveyFolder | null>(null)
    const [documents, setDocuments] = useState<SurveyDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [showUpload, setShowUpload] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadData = async () => {
        if (!folderId) return
        try {
            const [f, d] = await Promise.all([
                fetchSurveyFolder(folderId),
                fetchSurveyDocuments(folderId),
            ])
            setFolder(f)
            setDocuments(d)
        } catch {
            showToast("Failed to load folder.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [folderId])

    const handleStatusChange = (docId: string, status: DocumentStatus) => {
        setDocuments(prev =>
            prev.map(d => d.id === docId ? { ...d, status } : d)
        )
    }

    const handleDelete = async (docId: string) => {
        if (!folderId) return
        setDeletingId(docId)
        try {
            await deleteSurveyDocument(folderId, docId)
            setDocuments(prev => prev.filter(d => d.id !== docId))
            showToast("Document deleted.", "success")
        } catch {
            showToast("Failed to delete document.", "error")
        } finally {
            setDeletingId(null)
        }
    }

    const handleAIPrioritise = async () => {
        if (!folder || documents.length === 0) {
            showToast("Upload at least one document first.", "error")
            return
        }
        setAiLoading(true)
        try {
            const results = await runAIPrioritisation(documents, folder)

            await Promise.all(
                results.map(r =>
                    updateDocumentPriority(folder.id, r.id, r.rank, r.reason)
                )
            )

            setDocuments(prev =>
                prev
                    .map(d => {
                        const r = results.find(x => x.id === d.id)
                        return r
                            ? { ...d, priorityRank: r.rank, priorityReason: r.reason }
                            : d
                    })
                    .sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99))
            )

            showToast("Documents ranked by AI!", "success")
        } catch {
            showToast("AI prioritisation failed. Please try again.", "error")
        } finally {
            setAiLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!folder) {
        return (
            <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} className="text-muted-foreground" />
                <p className="text-muted-foreground">Folder not found.</p>
                <Button onClick={() => navigate("/survey")} variant="outline" className="rounded-full">
                    Back to Survey Analysis
                </Button>
            </div>
        )
    }

    const isRanked = documents.some(d => d.priorityRank !== null)

    return (
        <div className="min-h-screen bg-background pt-24">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
                {/* Top bar */}
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/survey")}
                            className="w-9 h-9 rounded-full flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all mt-1"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Survey Folder
                                </span>
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md text-foreground font-semibold">
                                    {folder.uniqueId}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight mt-0.5">
                                {folder.district}, {folder.state}
                            </h1>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    {folder.subDistrict} · {folder.block} · Ward {folder.wardNo}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Hash size={11} />
                                    {documents.length} document{documents.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            onClick={() => setShowUpload(true)}
                            className="rounded-full gap-2 font-medium"
                        >
                            <Upload size={15} /> Upload Document
                        </Button>
                        <Button
                            onClick={handleAIPrioritise}
                            disabled={aiLoading || documents.length === 0}
                            className="rounded-full gap-2 font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                        >
                            {aiLoading
                                ? <><Loader2 size={15} className="animate-spin" />Analysing...</>
                                : <><Sparkles size={15} /> AI Prioritise</>}
                        </Button>
                    </div>
                </div>

                {/* AI ranked notice */}
                {isRanked && (
                    <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Sparkles size={15} className="text-violet-400 flex-shrink-0" />
                        <p className="text-sm text-violet-300 font-medium">
                            Documents are sorted by AI priority — highest urgency first.
                        </p>
                    </div>
                )}

                {/* Documents table */}
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <FileText size={28} className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">No documents yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload your first document to this survey folder.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowUpload(true)}
                            className="rounded-full px-6 gap-2 mt-1"
                        >
                            <Upload size={15} /> Upload Document
                        </Button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {/* Table header */}
                        <div className={`grid gap-4 px-5 py-3 bg-muted/40 border-b border-border ${isRanked ? "grid-cols-[2fr_1fr_0.6fr_2fr_80px]" : "grid-cols-[2fr_1fr_80px]"}`}>
                            {["Name", "Status", ...(isRanked ? ["Rank", "AI Reason"] : []), ""].map(h => (
                                <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                            {documents.map(doc => (
                                <div
                                    key={doc.id}
                                    className={`grid gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors ${isRanked ? "grid-cols-[2fr_1fr_0.6fr_2fr_80px]" : "grid-cols-[2fr_1fr_80px]"}`}
                                >
                                    {/* Name */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={15} className="text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium text-foreground truncate">
                                            {doc.name}
                                        </span>
                                        {doc.priorityRank === 1 && (
                                            <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                                                Top Priority
                                            </span>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <StatusDropdown
                                            docId={doc.id}
                                            folderId={folder.id}
                                            current={doc.status}
                                            onChange={status => handleStatusChange(doc.id, status)}
                                        />
                                    </div>

                                    {/* AI Rank (if ranked) */}
                                    {isRanked && (
                                        <div className="flex items-center">
                                            {doc.priorityRank !== null ? (
                                                <span className={`text-sm font-bold ${doc.priorityRank === 1 ? "text-amber-500" : doc.priorityRank <= 3 ? "text-orange-400" : "text-muted-foreground"}`}>
                                                    #{doc.priorityRank}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Reason (if ranked) */}
                                    {isRanked && (
                                        <p className="text-xs text-muted-foreground italic truncate">
                                            {doc.priorityReason ?? "—"}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <a
                                            href={doc.fileURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                            title="Open file"
                                        >
                                            <ExternalLink size={13} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={deletingId === doc.id}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            title="Delete document"
                                        >
                                            {deletingId === doc.id
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showUpload && currentUser && folder && (
                <UploadModal
                    folderId={folder.id}
                    folder={folder}
                    workerUid={currentUser.uid}
                    onClose={() => setShowUpload(false)}
                    onUploaded={loadData}
                />
            )}
        </div>
    )
}
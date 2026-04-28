// src/pages/SurveyFolder.tsx

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

////////////////////////////////////////////////////////////////////////////////
// STATUS BADGE
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// STATUS DROPDOWN (BEST VERSION - from 1st)
////////////////////////////////////////////////////////////////////////////////

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
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const options: DocumentStatus[] = ["not started", "active", "completed"]

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-all"
            >
                <StatusBadge status={current} />
                <ChevronDown
                    size={14}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute top-full mt-2 left-0 z-[9999] bg-[#111] border border-white/10 rounded-xl shadow-2xl min-w-[180px] p-1">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={async () => {
                                await updateDocumentStatus(folderId, docId, opt)
                                onChange(opt)
                                setOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-muted ${opt === current ? "bg-muted font-semibold" : ""}`}
                        >
                            <StatusBadge status={opt} />
                            {opt === current && (
                                <CheckCircle size={14} className="text-green-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

////////////////////////////////////////////////////////////////////////////////
// AI PRIORITISATION (unchanged)
////////////////////////////////////////////////////////////////////////////////

async function runAIPrioritisation(
    documents: SurveyDocument[],
    folderMeta: SurveyFolder
): Promise<{ id: string; rank: number; reason: string }[]> {

    const docList = documents
        .map((d, i) => `${i + 1}. Name: "${d.name}" | Type: ${d.fileType || "unknown"} | Status: ${d.status}`)
        .join("\n")

    const prompt = `You are an NGO field operations analyst...

${docList}`

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
        ?.filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("") ?? ""

    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)

    return parsed.map((item: any) => ({
        id: documents[item.index - 1].id,
        rank: item.rank,
        reason: item.reason,
    }))
}

////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
////////////////////////////////////////////////////////////////////////////////

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

    const handleAIPrioritise = async () => {
        if (!folder || documents.length === 0) return

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
                        return r ? { ...d, priorityRank: r.rank, priorityReason: r.reason } : d
                    })
                    .sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99))
            )

            showToast("Documents ranked by AI!", "success")

        } catch {
            showToast("AI prioritisation failed.", "error")
        } finally {
            setAiLoading(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!folder) {
        return <div>Folder not found</div>
    }

    const isRanked = documents.some(d => d.priorityRank !== null)

    return (
        <div className="min-h-screen bg-background pt-24">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* HEADER */}
                <div className="flex justify-between mb-6">
                    <Button onClick={() => setShowUpload(true)}>
                        <Upload size={14} /> Upload
                    </Button>

                    <Button onClick={handleAIPrioritise} disabled={aiLoading}>
                        {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={14} />}
                        AI Prioritise
                    </Button>
                </div>

                {/* TABLE */}
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <div className="divide-y">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex justify-between p-4">
                                <span>{doc.name}</span>

                                <StatusDropdown
                                    docId={doc.id}
                                    folderId={folder.id}
                                    current={doc.status}
                                    onChange={(status) => {
                                        setDocuments(prev =>
                                            prev.map(d =>
                                                d.id === doc.id ? { ...d, status } : d
                                            )
                                        )
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
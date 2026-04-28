// src/pages/SurveyAnalysis.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NGO-only page. Shows all survey folders in a table-like list.
// Each row: Unique ID, Date, State, District, Sub-district, Block, Ward No.
// Clicking a row navigates to /survey/:folderId (SurveyFolder page).
// "New Folder" button opens a modal form.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
    createSurveyFolder,
    fetchNGOSurveyFolders,
    type SurveyFolder,
} from "../lib/surveyService"
import { Button } from "@/components/ui/button"
import {
    FolderPlus, Folder, ChevronRight, X, Loader2,
    MapPin, Calendar, Hash, ArrowLeft,
} from "lucide-react"
import { INDIA_LOCATION_DATA } from "../lib/indiaLocationData"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring " +
    "focus:border-transparent transition-all"

// ── Create Folder Modal ────────────────────────────────────────────────────────

function CreateFolderModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: () => void
}) {
    const { currentUser } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        state: "",
        district: "",
        subDistrict: "",
        block: "",
        wardNo: "",
    })

    // Derived options from cascading location data
    const states = Object.keys(INDIA_LOCATION_DATA)
    const districts = form.state
        ? Object.keys(INDIA_LOCATION_DATA[form.state] || {})
        : []
    const subDistricts =
        form.state && form.district
            ? INDIA_LOCATION_DATA[form.state][form.district] || []
            : []

    const setField = (k: string, v: string) =>
        setForm(prev => ({ ...prev, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser) return
        const allFilled = Object.values(form).every(v => v.trim() !== "")
        if (!allFilled) {
            showToast("Please fill in all fields.", "error")
            return
        }
        setLoading(true)
        try {
            await createSurveyFolder(currentUser.uid, form)
            showToast("Survey folder created!", "success")
            onCreated()
            onClose()
        } catch {
            showToast("Failed to create folder. Please try again.", "error")
        } finally {
            setLoading(false)
        }
    }

    // Plain-input fields (Block & Ward No. have no dropdown data source)
    const plainFields: { key: "block" | "wardNo"; label: string; placeholder: string }[] = [
        { key: "block", label: "Block", placeholder: "e.g. Khed" },
        { key: "wardNo", label: "Ward No.", placeholder: "e.g. 14" },
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">New Survey Folder</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Enter location details for this survey
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-4">

                    {/* State — cascading dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            State <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={form.state}
                            onValueChange={(value) =>
                                setForm({ ...form, state: value, district: "", subDistrict: "" })
                            }
                        >
                            <SelectTrigger className={inputCls}>
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* District — cascading dropdown, depends on state */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            District <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={form.district}
                            onValueChange={(value) =>
                                setForm({ ...form, district: value, subDistrict: "" })
                            }
                            disabled={!form.state}
                        >
                            <SelectTrigger className={inputCls}>
                                <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>
                                {districts.map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sub-district — cascading dropdown, depends on district */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            Sub-district <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={form.subDistrict}
                            onValueChange={(value) => setField("subDistrict", value)}
                            disabled={!form.district}
                        >
                            <SelectTrigger className={inputCls}>
                                <SelectValue placeholder="Select Sub-district" />
                            </SelectTrigger>
                            <SelectContent>
                                {subDistricts.map((sd) => (
                                    <SelectItem key={sd} value={sd}>{sd}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Block & Ward No. — plain text inputs (no dropdown source) */}
                    {plainFields.map(({ key, label, placeholder }) => (
                        <div key={key} className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                {label} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={form[key]}
                                onChange={e => setField(key, e.target.value)}
                                placeholder={placeholder}
                                required
                                className={inputCls}
                            />
                        </div>
                    ))}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="rounded-full h-11 font-semibold mt-2"
                    >
                        {loading
                            ? <><Loader2 size={15} className="animate-spin mr-2" />Creating...</>
                            : "Create Folder"}
                    </Button>
                </form>
            </div>
        </div>
    )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SurveyAnalysis() {
    const { currentUser } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [folders, setFolders] = useState<SurveyFolder[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)

    const loadFolders = async () => {
        if (!currentUser) return
        try {
            const data = await fetchNGOSurveyFolders(currentUser.uid)
            setFolders(data)
        } catch {
            showToast("Failed to load survey folders.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadFolders() }, [currentUser])

    const formatDate = (ts: SurveyFolder["createdAt"]) => {
        if (!ts) return "—"
        const d = ts.toDate()
        return d.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        })
    }

    return (
        <div className="min-h-screen bg-background pt-24">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="w-9 h-9 rounded-full flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Survey Analysis
                            </p>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                Survey Folders
                            </h1>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="rounded-full px-5 gap-2 font-semibold"
                    >
                        <FolderPlus size={16} />
                        New Folder
                    </Button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 size={28} className="animate-spin text-muted-foreground" />
                    </div>
                ) : folders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <Folder size={28} className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">No survey folders yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create your first folder to start organising survey data.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCreate(true)}
                            className="rounded-full px-6 gap-2 mt-1"
                        >
                            <FolderPlus size={15} /> Create Folder
                        </Button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1.2fr_1.2fr_1fr_0.8fr_40px] gap-3 px-5 py-3 bg-muted/40 border-b border-border">
                            {[
                                { icon: Hash, label: "Unique ID" },
                                { icon: Calendar, label: "Date" },
                                { icon: MapPin, label: "State" },
                                { icon: null, label: "District" },
                                { icon: null, label: "Sub-district" },
                                { icon: null, label: "Block" },
                                { icon: null, label: "Ward No." },
                                { icon: null, label: "" },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    {Icon && <Icon size={11} className="text-muted-foreground" />}
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => navigate(`/survey/${folder.id}`)}
                                    className="w-full grid grid-cols-[1.4fr_1fr_1.2fr_1.2fr_1.2fr_1fr_0.8fr_40px] gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder size={15} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                        <span className="text-sm font-mono font-semibold text-foreground truncate">
                                            {folder.uniqueId}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground truncate self-center">
                                        {formatDate(folder.createdAt)}
                                    </span>
                                    <span className="text-sm text-foreground truncate self-center">
                                        {folder.state}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate self-center">
                                        {folder.district}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate self-center">
                                        {folder.subDistrict}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate self-center">
                                        {folder.block}
                                    </span>
                                    <span className="text-sm text-muted-foreground self-center">
                                        {folder.wardNo}
                                    </span>
                                    <div className="flex items-center justify-center self-center">
                                        <ChevronRight
                                            size={16}
                                            className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateFolderModal
                    onClose={() => setShowCreate(false)}
                    onCreated={loadFolders}
                />
            )}
        </div>
    )
}
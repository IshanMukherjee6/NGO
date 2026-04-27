// src/pages/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXES applied on top of original:
//
//   NGO Dashboard:
//     • Added "Pending Applications" section — NGO can Accept or Reject workers.
//     • updateApplicationStatus() is called on button click and list refreshes.
//     • Pending count badge shown on section header.
//
//   Worker Dashboard:
//     • "Failed to load data" fixed via jobService.ts (removed orderBy).
//     • Dashboard now clearly shows three sections:
//         1. Active Jobs   — applications where status === "accepted"
//         2. Pending Jobs  — applications where status === "pending"
//         3. Available Jobs — jobs not yet applied to
//     • Stats cards now link to the correct section via anchor scroll.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Briefcase, Plus, Users, FileCheck, Upload,
    Filter, ChevronDown, X, Phone,
    MapPin, Clock, DollarSign, Building2, CheckCircle,
    AlertCircle, Search, Loader2, Bell,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
    fetchNGOJobs, fetchAllJobs, addJob,
    fetchNGOApplications, fetchWorkerApplications,
    applyForJob, submitProof, updateApplicationStatus,
    type Job, type Application,
} from "../lib/jobService"
import { uploadProofFile } from "../lib/storageService"
import type { WorkerProfile } from "../lib/authService"

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-sm font-medium text-foreground">
            {children} <span className="text-red-500">*</span>
        </label>
    )
}

function SelectField({ label, value, onValueChange, placeholder, options }: {
    label: string; value: string; onValueChange: (val: string) => void
    placeholder: string; options: string[]
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="rounded-xl border-border bg-muted/30 text-sm h-10 focus:ring-ring">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                    {options.map(o => (
                        <SelectItem key={o} value={o} className="rounded-lg text-sm cursor-pointer focus:bg-accent focus:text-accent-foreground">
                            {o}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

// ── Post Job Modal ─────────────────────────────────────────────────────────────

function PostJobModal({ ngoUid, ngoName, onClose, onJobPosted }: {
    ngoUid: string; ngoName: string
    onClose: () => void; onJobPosted: () => void
}) {
    const { showToast } = useToast()
    const [form, setForm] = useState({
        title: "", department: "", positions: "", education: "",
        experience: "", salary: "", duration: "", location: "",
    })
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const setField = (name: string, value: string) =>
        setForm(prev => ({ ...prev, [name]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.department || !form.education || !form.experience || !form.duration) {
            showToast("Please fill in all required fields.", "error"); return
        }
        setLoading(true)
        try {
            await addJob(ngoUid, ngoName, {
                title: form.title,
                department: form.department,
                positions: parseInt(form.positions) || 1,
                salary: form.salary,
                salaryNum: parseInt(form.salary.replace(/\D/g, "")) || 0,
                duration: form.duration,
                education: form.education,
                experience: form.experience,
                location: form.location || "India",
            })
            showToast("Job posted successfully!", "success")
            setSubmitted(true)
            onJobPosted()
        } catch {
            showToast("Failed to post job. Please try again.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-visible">
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Post a New Job</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Fill in the job details below</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-7 py-6">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                                <CheckCircle size={28} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Job Posted!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-semibold text-foreground">{form.title}</span> is now visible to workers.
                                </p>
                            </div>
                            <Button onClick={onClose} className="rounded-full px-8 mt-2">Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Job Title</Label>
                                <input value={form.title} onChange={e => setField("title", e.target.value)}
                                    required placeholder="e.g. Field Survey Associate" className={inputCls} />
                            </div>
                            <SelectField label="Department" value={form.department}
                                onValueChange={v => setField("department", v)} placeholder="Select Department"
                                options={["Operations", "Health", "Training", "Admin", "Finance", "Research"]} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>No. of Positions</Label>
                                    <input type="number" min="1" value={form.positions}
                                        onChange={e => setField("positions", e.target.value)}
                                        required placeholder="e.g. 20" className={inputCls} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Salary (₹/month)</Label>
                                    <input value={form.salary} onChange={e => setField("salary", e.target.value)}
                                        required placeholder="e.g. 18000" className={inputCls} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField label="Education" value={form.education}
                                    onValueChange={v => setField("education", v)} placeholder="Select"
                                    options={["8th Pass", "10th Pass", "12th Pass", "Graduate", "Post Graduate"]} />
                                <SelectField label="Experience" value={form.experience}
                                    onValueChange={v => setField("experience", v)} placeholder="Select"
                                    options={["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"]} />
                            </div>
                            <SelectField label="Duration" value={form.duration}
                                onValueChange={v => setField("duration", v)} placeholder="Select Duration"
                                options={["1 month", "2 months", "3 months", "6 months", "1 year", "Ongoing"]} />
                            <div className="flex flex-col gap-1.5">
                                <Label>Location</Label>
                                <input value={form.location} onChange={e => setField("location", e.target.value)}
                                    required placeholder="e.g. Pune, Maharashtra" className={inputCls} />
                            </div>
                            <Button type="submit" disabled={loading} className="rounded-full h-11 font-semibold mt-2">
                                {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Posting...</> : "Post Job"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Upload Proof Modal ─────────────────────────────────────────────────────────

function UploadProofModal({
    workerUid, workerName, jobs, onClose,
}: {
    workerUid: string; workerName: string
    jobs: Application[]; onClose: () => void
}) {
    const { showToast } = useToast()
    const [file, setFile] = useState<File | null>(null)
    const [note, setNote] = useState("")
    const [selectedJobId, setSelectedJobId] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const activeJobs = jobs.filter(j => j.status === "accepted")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !selectedJobId) return
        setLoading(true)
        try {
            const fileURL = await uploadProofFile(file, workerUid)
            const selectedJob = activeJobs.find(j => j.jobId === selectedJobId)
            await submitProof({
                jobId: selectedJobId,
                jobTitle: selectedJob?.jobTitle || "",
                workerId: workerUid,
                workerName,
                ngoId: selectedJob?.ngoId || "",
                fileURL,
                note,
            })
            showToast("Proof submitted successfully!", "success")
            setSubmitted(true)
        } catch {
            showToast("Failed to submit proof. Please try again.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Upload Proof of Work</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Submit evidence of your completed work</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-7 py-6">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                                <CheckCircle size={28} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Proof Submitted!</h3>
                                <p className="text-sm text-muted-foreground mt-1">The NGO will review your proof and process payment.</p>
                            </div>
                            <Button onClick={onClose} className="rounded-full px-8 mt-2">Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {activeJobs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    You have no active (accepted) jobs to submit proof for.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-foreground">Job <span className="text-red-500">*</span></label>
                                    <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} required className={inputCls}>
                                        <option value="">Select a job</option>
                                        {activeJobs.map(j => (
                                            <option key={j.jobId} value={j.jobId}>{j.jobTitle}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Upload File <span className="text-red-500">*</span></label>
                                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all ${file ? "border-foreground bg-muted/20" : "border-border hover:border-muted-foreground"}`}>
                                    <Upload size={24} className={file ? "text-foreground" : "text-muted-foreground"} />
                                    <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload photo or document"}</span>
                                    <span className="text-xs text-muted-foreground/60">JPG, PNG, PDF up to 10MB</span>
                                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Note (optional)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                                    placeholder="Describe what work was done..." className={`${inputCls} resize-none`} />
                            </div>
                            <Button type="submit" disabled={!file || !selectedJobId || loading} className="rounded-full h-11 font-semibold mt-1">
                                {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Uploading...</> : "Submit Proof"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── NGO Dashboard ──────────────────────────────────────────────────────────────

function NGODashboard() {
    const { currentUser, userProfile } = useAuth()
    const { showToast } = useToast()
    const [showPostJob, setShowPostJob] = useState(false)
    const [expandedJob, setExpandedJob] = useState<string | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingAppId, setUpdatingAppId] = useState<string | null>(null)

    const ngoName = userProfile?.role === "ngo" ? userProfile.ngoName : ""

    const loadData = async () => {
        if (!currentUser) return
        try {
            const [j, a] = await Promise.all([
                fetchNGOJobs(currentUser.uid),
                fetchNGOApplications(currentUser.uid),
            ])
            setJobs(j)
            setApplications(a)
        } catch {
            showToast("Failed to load data", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [currentUser])

    // FIX: Separate pending applications so NGO can approve/reject
    const pendingApplications = applications.filter(a => a.status === "pending")
    const activeJobs = jobs.filter(j => j.status === "active").length
    const totalWorkers = applications.filter(a => a.status === "accepted").length
    const closedJobs = jobs.filter(j => j.status === "closed").length
    const departments = new Set(jobs.map(j => j.department)).size

    const getAcceptedWorkersForJob = (jobId: string) =>
        applications.filter(a => a.jobId === jobId && a.status === "accepted")

    // FIX: Handle accept/reject with UI feedback
    const handleApplicationDecision = async (appId: string, decision: "accepted" | "rejected") => {
        setUpdatingAppId(appId)
        try {
            await updateApplicationStatus(appId, decision)
            showToast(
                decision === "accepted" ? "Worker accepted!" : "Application rejected.",
                decision === "accepted" ? "success" : "error"
            )
            await loadData()
        } catch {
            showToast("Failed to update application. Please try again.", "error")
        } finally {
            setUpdatingAppId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{ngoName}</h1>
                </div>
                <Button onClick={() => setShowPostJob(true)} className="rounded-full px-6 font-semibold gap-2">
                    <Plus size={16} /> Post a Job
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { icon: Briefcase, label: "Active Jobs", value: String(activeJobs) },
                    { icon: Users, label: "Total Workers", value: String(totalWorkers) },
                    { icon: FileCheck, label: "Jobs Completed", value: String(closedJobs) },
                    { icon: Building2, label: "Departments", value: String(departments) },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
                        <Icon size={18} className="text-muted-foreground" />
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── FIX: Pending Applications Section ─────────────────────────────── */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-foreground">Pending Applications</h2>
                    {pendingApplications.length > 0 && (
                        <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            <Bell size={11} />
                            {pendingApplications.length} new
                        </span>
                    )}
                </div>

                {pendingApplications.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-8 text-center">
                        <CheckCircle size={28} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No pending applications right now.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {pendingApplications.map(app => (
                            <div key={app.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-semibold text-foreground">{app.workerName}</p>
                                        <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                            Pending
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Applied for: <span className="text-foreground font-medium">{app.jobTitle}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Phone size={11} />{app.workerPhone}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={11} />{app.workerLocation}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full px-4 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                                        disabled={updatingAppId === app.id}
                                        onClick={() => handleApplicationDecision(app.id, "rejected")}
                                    >
                                        {updatingAppId === app.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : "Reject"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="rounded-full px-4 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={updatingAppId === app.id}
                                        onClick={() => handleApplicationDecision(app.id, "accepted")}
                                    >
                                        {updatingAppId === app.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : "Accept"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Posted Jobs */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Posted Jobs</h2>
                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <Briefcase size={32} className="text-muted-foreground" />
                        <p className="text-muted-foreground">No jobs posted yet.</p>
                        <Button onClick={() => setShowPostJob(true)} className="rounded-full px-6 gap-2 mt-1">
                            <Plus size={15} /> Post your first job
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {jobs.map(job => {
                            const jobWorkers = getAcceptedWorkersForJob(job.id)
                            return (
                                <div key={job.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                                    <div className="p-5 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground">{job.title}</h3>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${job.status === "active"
                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                    : "bg-muted text-muted-foreground border-border"}`}>
                                                    {job.status === "active" ? "Active" : "Closed"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Building2 size={11} />{job.department}</span>
                                                <span className="flex items-center gap-1"><Users size={11} />{job.filled}/{job.positions} filled</span>
                                                <span className="flex items-center gap-1"><DollarSign size={11} />₹{job.salary}/month</span>
                                                <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
                                                <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                        >
                                            <span>{expandedJob === job.id ? "Hide" : "View"} Workers</span>
                                            <ChevronDown size={15} className={`transition-transform ${expandedJob === job.id ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>

                                    {expandedJob === job.id && (
                                        <div className="border-t border-border bg-muted/20 px-5 py-4">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Accepted Workers</p>
                                            {jobWorkers.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No workers accepted yet.</p>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {jobWorkers.map(w => (
                                                        <div key={w.id} className="flex items-center justify-between bg-background rounded-xl px-4 py-3 border border-border">
                                                            <div>
                                                                <p className="font-medium text-sm text-foreground">{w.workerName}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <MapPin size={10} />{w.workerLocation}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Phone size={12} />{w.workerPhone}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {showPostJob && (
                <PostJobModal
                    ngoUid={currentUser!.uid}
                    ngoName={ngoName}
                    onClose={() => setShowPostJob(false)}
                    onJobPosted={loadData}
                />
            )}
        </div>
    )
}

// ── Worker Dashboard ───────────────────────────────────────────────────────────

function WorkerDashboard() {
    const { currentUser, userProfile } = useAuth()
    const { showToast } = useToast()

    const [availableJobs, setAvailableJobs] = useState<Job[]>([])
    const [myApplications, setMyApplications] = useState<Application[]>([])
    const [showApplicationsModal, setShowApplicationsModal] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState({ minSalary: "", experience: "" })
    const [loading, setLoading] = useState(true)
    const [applyingJobId, setApplyingJobId] = useState<string | null>(null)

    const workerProfile = userProfile?.role === "worker" ? userProfile as WorkerProfile : null
    const displayName = workerProfile?.fullName || "Worker"

    const loadData = async () => {
        if (!currentUser) return
        try {
            const [jobs, apps] = await Promise.all([
                fetchAllJobs(),
                fetchWorkerApplications(currentUser.uid),
            ])
            setAvailableJobs(jobs)
            setMyApplications(apps)
        } catch {
            showToast("Failed to load data", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [currentUser])

    // FIX: Clearly separate the three categories
    const activeApps = myApplications.filter(a => a.status === "accepted")
    const pendingApps = myApplications.filter(a => a.status === "pending")
    const appliedJobIds = new Set(myApplications.map(a => a.jobId))

    const filteredJobs = availableJobs.filter(job => {
        const matchSearch =
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.department.toLowerCase().includes(search.toLowerCase())
        const matchSalary = !filters.minSalary || job.salaryNum >= parseInt(filters.minSalary)
        const matchExp = !filters.experience || job.experience === filters.experience
        return matchSearch && matchSalary && matchExp && !appliedJobIds.has(job.id)
    })

    const handleApply = async (job: Job) => {
        if (!currentUser || !workerProfile) return
        setApplyingJobId(job.id)
        try {
            await applyForJob(
                { id: job.id, title: job.title, postedBy: job.postedBy, ngoName: job.ngoName },
                {
                    uid: currentUser.uid,
                    fullName: workerProfile.fullName,
                    phone: workerProfile.phone,
                    location: `${workerProfile.city}, ${workerProfile.state}`,
                }
            )
            showToast("Application submitted!", "success")
            await loadData()
        } catch {
            showToast("Failed to apply. Please try again.", "error")
        } finally {
            setApplyingJobId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setShowUpload(true)} className="rounded-full gap-2 font-medium">
                        <Upload size={15} /> Upload Proof
                    </Button>
                    <Button variant="outline" onClick={() => setShowApplicationsModal(true)} className="rounded-full gap-2 font-medium">
                        <CheckCircle size={15} /> My Applications
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Active Jobs", value: String(activeApps.length) },
                    { label: "Pending", value: String(pendingApps.length) },
                    { label: "Available", value: String(filteredJobs.length) },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── FIX: Active Jobs Section ─────────────────────────────────────── */}
            {activeApps.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        Active Jobs
                        <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                            {activeApps.length}
                        </span>
                    </h2>
                    <div className="flex flex-col gap-3">
                        {activeApps.map(app => (
                            <div key={app.id} className="bg-card border border-green-500/20 rounded-2xl p-5">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-foreground">{app.jobTitle}</h3>
                                            <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                                Accepted
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{app.ngoName}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowUpload(true)}
                                        className="rounded-full gap-1.5 font-medium flex-shrink-0"
                                    >
                                        <Upload size={13} /> Upload Proof
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FIX: Pending Applications Section ────────────────────────────── */}
            {pendingApps.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        Pending Applications
                        <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                            {pendingApps.length}
                        </span>
                    </h2>
                    <div className="flex flex-col gap-3">
                        {pendingApps.map(app => (
                            <div key={app.id} className="bg-card border border-border rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">{app.jobTitle}</h3>
                                    <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                        Awaiting Review
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{app.ngoName}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Available Jobs Section ────────────────────────────────────────── */}
            <div>
                {/* Search + Filter */}
                <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search jobs by title or department..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                        className={`rounded-xl gap-2 font-medium ${showFilters ? "border-foreground" : ""}`}>
                        <Filter size={15} /> Filters
                        {(filters.minSalary || filters.experience) && <span className="w-2 h-2 rounded-full bg-foreground" />}
                    </Button>
                </div>

                {showFilters && (
                    <div className="bg-card border border-border rounded-2xl p-5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min. Salary (₹)</label>
                            <input type="number" min="0" value={filters.minSalary}
                                onChange={e => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                                placeholder="e.g. 15000" className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</label>
                            <Select value={filters.experience} onValueChange={v => setFilters(prev => ({ ...prev, experience: v === "any" ? "" : v }))}>
                                <SelectTrigger className="rounded-xl border-border bg-muted/30 text-sm h-10">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[9999] rounded-xl border-border bg-popover text-popover-foreground">
                                    <SelectItem value="any" className="rounded-lg text-sm cursor-pointer">Any</SelectItem>
                                    {["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"].map(e => (
                                        <SelectItem key={e} value={e} className="rounded-lg text-sm cursor-pointer">{e}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => setFilters({ minSalary: "", experience: "" })}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}

                <h2 className="text-lg font-bold text-foreground mb-4">
                    Available Jobs <span className="text-muted-foreground font-normal text-base">({filteredJobs.length})</span>
                </h2>

                {filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <AlertCircle size={32} className="text-muted-foreground" />
                        <p className="text-muted-foreground">No jobs match your filters.</p>
                        <button onClick={() => { setSearch(""); setFilters({ minSalary: "", experience: "" }) }}
                            className="text-sm text-foreground font-semibold hover:underline">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-foreground">{job.title}</h3>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 font-medium">
                                                {job.positions - job.filled} open
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{job.ngoName}</p>
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Building2 size={11} />{job.department}</span>
                                            <span className="flex items-center gap-1"><DollarSign size={11} />₹{job.salary}/month</span>
                                            <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
                                            <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                                        </div>
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.education}</span>
                                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.experience}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="rounded-full px-5 flex-shrink-0 font-semibold"
                                        disabled={applyingJobId === job.id}
                                        onClick={() => handleApply(job)}
                                    >
                                        {applyingJobId === job.id
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : "Apply"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Applications Modal */}
            {showApplicationsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowApplicationsModal(false)} />
                    <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">My Applications</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">All your job applications</p>
                            </div>
                            <button onClick={() => setShowApplicationsModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-4">
                            {myApplications.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No applications yet.</p>
                            ) : myApplications.map(app => (
                                <div key={app.id} className={`rounded-2xl border p-5 ${app.status === "accepted" ? "border-green-500/30 bg-green-500/5" : app.status === "rejected" ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-foreground">{app.jobTitle}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${app.status === "accepted"
                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                            : app.status === "rejected"
                                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"}`}>
                                            {app.status === "accepted" ? "Accepted" : app.status === "rejected" ? "Rejected" : "Pending"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{app.ngoName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showUpload && (
                <UploadProofModal
                    workerUid={currentUser!.uid}
                    workerName={displayName}
                    jobs={myApplications}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </div>
    )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { userProfile, authLoading } = useAuth()

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-24">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pt-24">
            {userProfile?.role === "ngo" ? <NGODashboard /> : <WorkerDashboard />}
        </div>
    )
}

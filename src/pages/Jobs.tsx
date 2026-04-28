// src/pages/Jobs.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES:
//   • Filters now match Dashboard exactly: minSalary, experience, department, location
//   • Email shown beside phone in worker info (where applicable)
//   • Alert shown on apply success
//   • Profile completeness guard: blocks apply if education/experience/skills missing
//   • Qualification snapshot: persists worker qualifications onto the application doc
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Building2, Clock, DollarSign, MapPin,
    Search, Filter, X, LogIn, UserPlus, AlertCircle, Loader2, Mail,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { fetchAllJobs, applyForJob, fetchWorkerApplications, type Job } from "../lib/jobService"
import type { WorkerProfile } from "../lib/authService"
import SalaryInput from "@/components/SalaryInput"

const inputCls = "px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"

function LoginPrompt({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <X size={16} />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <LogIn size={24} className="text-foreground" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Sign in to Apply</h2>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        You need a worker account to apply for jobs.
                    </p>
                </div>
                <div className="flex flex-col gap-2.5 w-full">
                    <Button className="rounded-full h-11 font-semibold gap-2" onClick={() => navigate("/login")}>
                        <LogIn size={16} /> Log In
                    </Button>
                    <Button variant="outline" className="rounded-full h-11 font-semibold gap-2" onClick={() => navigate("/register/worker")}>
                        <UserPlus size={16} /> Create Worker Account
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Are you an NGO?{" "}
                    <button onClick={() => navigate("/register/ngo")} className="text-foreground font-semibold hover:underline">Register here</button>
                </p>
            </div>
        </div>
    )
}

const DEPARTMENTS = ["Operations", "Health", "Training", "Admin", "Finance", "Research"]
const EXPERIENCE_OPTIONS = ["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"]

function FilterSelect({
    label,
    value,
    onValueChange,
    placeholder,
    options,
}: {
    label: string
    value: string
    onValueChange: (val: string) => void
    placeholder: string
    options: { label: string; value: string }[]
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="
                h-11
                rounded-xl
                border border-white/10
                bg-[#222]/80
                text-sm
                px-3
                hover:bg-[#2a2a2a]
                focus:ring-2 focus:ring-white/20
                transition-all
                "
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default function Jobs() {
    const navigate = useNavigate()
    const { currentUser, userProfile } = useAuth()
    const { showToast } = useToast()

    const [allJobs, setAllJobs] = useState<Job[]>([])
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [applyingJobId, setApplyingJobId] = useState<string | null>(null)
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    const [search, setSearch] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        minSalary: "",
        experience: "",
        department: "",
        location: "",
    })

    useEffect(() => {
        const load = async () => {
            try {
                const jobs = await fetchAllJobs()
                setAllJobs(jobs)
                if (currentUser && userProfile?.role === "worker") {
                    const apps = await fetchWorkerApplications(currentUser.uid)
                    setAppliedJobIds(new Set(apps.map(a => a.jobId)))
                }
            } catch {
                showToast("Failed to load jobs", "error")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [currentUser])

    const hasActiveFilters = Object.values(filters).some(v => v !== "")

    const filteredJobs = allJobs.filter(job => {
        const matchSearch =
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.ngoName.toLowerCase().includes(search.toLowerCase()) ||
            job.department.toLowerCase().includes(search.toLowerCase()) ||
            job.location.toLowerCase().includes(search.toLowerCase())
        const matchSalary = !filters.minSalary || job.salaryNum >= parseInt(filters.minSalary)
        const matchExp = !filters.experience || job.experience === filters.experience
        const matchDept = !filters.department || job.department === filters.department
        const matchLoc = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase())
        return matchSearch && matchSalary && matchExp && matchDept && matchLoc
    })

    const clearFilters = () => setFilters({ minSalary: "", experience: "", department: "", location: "" })

    const handleApply = async (job: Job) => {
        if (!currentUser || !userProfile) { setShowLoginPrompt(true); return }
        if (userProfile.role === "ngo") { showToast("NGOs cannot apply for jobs.", "error"); return }
        if (appliedJobIds.has(job.id)) { showToast("You have already applied to this job.", "error"); return }

        setApplyingJobId(job.id)
        const workerProfile = userProfile as WorkerProfile

        // Profile completeness guard — workers from before the qualifications
        // migration may have undefined values. Letting them apply would
        // re-introduce the original bug (every application scored against
        // empty fields → all 50s).
        if (!workerProfile.education || !workerProfile.experience || !workerProfile.skills?.length) {
            setApplyingJobId(null)
            showToast(
                "Please complete your profile (education, experience, skills) before applying.",
                "error",
            )
            return
        }

        try {
            await applyForJob(
                { id: job.id, title: job.title, postedBy: job.postedBy, ngoName: job.ngoName },
                {
                    uid: currentUser.uid,
                    fullName: workerProfile.fullName,
                    phone: workerProfile.phone,
                    email: workerProfile.email || "",
                    location: `${workerProfile.city}, ${workerProfile.state}`,
                    // Qualification snapshot — same values that get scored.
                    // The NGO panel can show them without re-fetching the user,
                    // and the snapshot is stable even if the worker edits their
                    // profile later.
                    city: workerProfile.city,
                    state: workerProfile.state,
                    education: workerProfile.education,
                    experience: workerProfile.experience,
                    skills: workerProfile.skills,
                }
            )
            setAppliedJobIds(prev => new Set([...prev, job.id]))
            showToast(`✅ Applied for "${job.title}" successfully!`, "success")
        } catch {
            showToast("Failed to apply. Please try again.", "error")
        } finally {
            setApplyingJobId(null)
        }
    }

    return (
        <div className="min-h-screen bg-background pt-28 pb-16">
            <div className="max-w-5xl mx-auto px-6 md:px-10">
                <div className="mb-8">
                    <p className="text-xs tracking-widest uppercase text-muted-foreground font-semibold mb-2">Open Positions</p>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Find NGO Jobs Near You</h1>
                    <p className="text-muted-foreground mt-2 text-base">Browse available positions posted by NGOs.</p>
                </div>

                {/* Search + Filter toggle */}
                <div className="flex gap-3 mb-5 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by title, NGO, department or location..."
                            className="
                                        w-full pl-9 pr-4 py-2.5 rounded-xl
                                        bg-[#222]/80
                                        border border-white/10
                                        text-sm text-foreground
                                        placeholder:text-muted-foreground
                                        hover:bg-[#2a2a2a]
                                        focus:ring-2 focus:ring-white/20
                                        transition-all
" />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                        className={`rounded-xl gap-2 font-medium ${showFilters ? "border-foreground" : ""}`}>
                        <Filter size={15} /> Filters
                        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-foreground" />}
                    </Button>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div
                        className="
        bg-gradient-to-b from-[#1c1c1c] to-[#171717]
        border border-white/10
        rounded-2xl
        p-5 mb-5
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
        backdrop-blur-md
        shadow-[0_8px_30px_rgba(0,0,0,0.6)]
    "
                    >
                        {/* Salary */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Min. Salary (₹)
                            </label>
                            <SalaryInput
                                value={filters.minSalary}
                                onChange={(val) =>
                                    setFilters((p) => ({ ...p, minSalary: val }))
                                }
                            />
                        </div>

                        {/* Experience */}
                        <FilterSelect
                            label="Experience"
                            value={filters.experience}
                            onValueChange={(v) =>
                                setFilters((p) => ({ ...p, experience: v }))
                            }
                            placeholder="Any experience"
                            options={EXPERIENCE_OPTIONS.map((e) => ({ label: e, value: e }))}
                        />

                        {/* Department */}
                        <FilterSelect
                            label="Department"
                            value={filters.department}
                            onValueChange={(v) =>
                                setFilters((p) => ({ ...p, department: v }))
                            }
                            placeholder="Any department"
                            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
                        />

                        {/* Location */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Location
                            </label>
                            <input
                                value={filters.location}
                                onChange={(e) =>
                                    setFilters((p) => ({ ...p, location: e.target.value }))
                                }
                                placeholder="e.g. Mumbai"
                                className="
                h-11 px-3 rounded-xl
                bg-[#222]/80
                border border-white/10
                text-sm text-foreground
                placeholder:text-muted-foreground
                hover:bg-[#2a2a2a]
                focus:ring-2 focus:ring-white/20
                transition-all
                "
                            />
                        </div>

                        {/* Clear */}
                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 size={28} className="animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-4">
                            Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of {allJobs.length} jobs
                        </p>

                        {filteredJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                <AlertCircle size={32} className="text-muted-foreground" />
                                <p className="text-muted-foreground">No jobs match your search.</p>
                                <button onClick={() => { setSearch(""); clearFilters() }}
                                    className="text-sm text-foreground font-semibold hover:underline">Clear all filters</button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredJobs.map(job => {
                                    const applied = appliedJobIds.has(job.id)
                                    return (
                                        <div key={job.id} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.01] transition-all duration-300">
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
                                                <Button size="sm" className="rounded-full px-5 flex-shrink-0 font-semibold"
                                                    disabled={applied || applyingJobId === job.id}
                                                    variant={applied ? "outline" : "default"}
                                                    onClick={() => !applied && handleApply(job)}>
                                                    {applyingJobId === job.id ? <Loader2 size={14} className="animate-spin" /> : applied ? "Applied" : "Apply"}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {!currentUser && (
                            <div className="mt-12 p-8 rounded-2xl border border-border bg-muted/20 text-center">
                                <h3 className="font-bold text-lg text-foreground mb-2">Ready to get started?</h3>
                                <p className="text-muted-foreground text-sm mb-5">Create a free worker account to apply for jobs.</p>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <Button className="rounded-full px-6 font-semibold gap-2" onClick={() => setShowLoginPrompt(true)}>
                                        <UserPlus size={15} /> Create Account
                                    </Button>
                                    <Button variant="outline" className="rounded-full px-6 font-semibold gap-2" onClick={() => setShowLoginPrompt(true)}>
                                        <LogIn size={15} /> Log In
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
        </div>
    )
}
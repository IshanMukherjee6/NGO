import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Briefcase, Plus, Users, FileCheck, Upload,
    Filter, ChevronDown, X, Phone, Mail,
    MapPin, Clock, DollarSign, Building2, CheckCircle,
    AlertCircle, Search
} from "lucide-react"

// ─── Fake data ────────────────────────────────────────────────────────────────

const fakePostedJobs = [
    {
        id: 1,
        title: "Field Survey Associate",
        department: "Operations",
        positions: 20,
        filled: 14,
        salary: "₹18,000/month",
        duration: "3 months",
        education: "Graduate",
        experience: "1-2 years",
        status: "active",
        workers: [
            { name: "Ravi Kumar", phone: "9876543210", email: "ravi@email.com", location: "Pune" },
            { name: "Sneha Patil", phone: "9123456780", email: "sneha@email.com", location: "Nashik" },
        ],
    },
    {
        id: 2,
        title: "Community Health Worker",
        department: "Health",
        positions: 10,
        filled: 10,
        salary: "₹22,000/month",
        duration: "6 months",
        education: "12th Pass",
        experience: "Fresher",
        status: "closed",
        workers: [
            { name: "Amit Shah", phone: "9988776655", email: "amit@email.com", location: "Mumbai" },
        ],
    },
]

const fakeAvailableJobs = [
    {
        id: 1,
        title: "Field Survey Associate",
        ngo: "Help India Foundation",
        department: "Operations",
        positions: 6,
        salary: 18000,
        duration: "3 months",
        education: "Graduate",
        experience: "1-2 years",
        location: "Pune, Maharashtra",
    },
    {
        id: 2,
        title: "Livelihood Training Associate",
        ngo: "KSWA Yuva Parivartan",
        department: "Training",
        positions: 70,
        salary: 20000,
        duration: "6 months",
        education: "Graduate",
        experience: "3-5 years",
        location: "Mumbai, Maharashtra",
    },
    {
        id: 3,
        title: "Data Entry Operator",
        ngo: "Gram Vikas Trust",
        department: "Admin",
        positions: 15,
        salary: 14000,
        duration: "2 months",
        education: "12th Pass",
        experience: "Fresher",
        location: "Nagpur, Maharashtra",
    },
]

const fakeCompletedJobs = [
    {
        id: 1,
        title: "Community Mobilizer",
        ngo: "Seva Foundation",
        duration: "2 months",
        earned: "₹28,000",
        completedOn: "Jan 2025",
        status: "completed",
    },
    {
        id: 2,
        title: "Field Data Collector",
        ngo: "GreenEarth NGO",
        duration: "Ongoing",
        earned: "₹9,000 so far",
        completedOn: "Current",
        status: "current",
    },
]

// ─── Post Job Modal ───────────────────────────────────────────────────────────

function PostJobModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        title: "", department: "", positions: "", education: "",
        experience: "", salary: "", duration: "",
    })
    const [submitted, setSubmitted] = useState(false)

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Post a New Job</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Fill in the job details below</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-6">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                                <CheckCircle size={28} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Job Posted!</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    <span className="font-semibold text-gray-700">{form.title}</span> has been posted successfully and is now visible to workers.
                                </p>
                            </div>
                            <Button onClick={onClose} className="rounded-full px-8 mt-2">Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                            {/* Job Title */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                                <input name="title" value={form.title} onChange={set} required
                                    placeholder="e.g. Field Survey Associate"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all" />
                            </div>

                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                <select name="department" value={form.department} onChange={set} required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all appearance-none">
                                    <option value="">Select Department</option>
                                    {["Operations", "Health", "Training", "Admin", "Finance", "Research"].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Positions + Salary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">No. of Positions <span className="text-red-500">*</span></label>
                                    <input name="positions" type="number" value={form.positions} onChange={set} required
                                        placeholder="e.g. 20"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Expected Salary <span className="text-red-500">*</span></label>
                                    <input name="salary" value={form.salary} onChange={set} required
                                        placeholder="e.g. ₹18,000/month"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all" />
                                </div>
                            </div>

                            {/* Education + Experience */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Education <span className="text-red-500">*</span></label>
                                    <select name="education" value={form.education} onChange={set} required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all appearance-none">
                                        <option value="">Select</option>
                                        {["8th Pass", "10th Pass", "12th Pass", "Graduate", "Post Graduate"].map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Experience <span className="text-red-500">*</span></label>
                                    <select name="experience" value={form.experience} onChange={set} required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all appearance-none">
                                        <option value="">Select</option>
                                        {["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"].map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Duration <span className="text-red-500">*</span></label>
                                <select name="duration" value={form.duration} onChange={set} required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all appearance-none">
                                    <option value="">Select Duration</option>
                                    {["1 month", "2 months", "3 months", "6 months", "1 year", "Ongoing"].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <Button type="submit" className="rounded-full h-11 font-semibold mt-2">
                                Post Job
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Upload Proof Modal ───────────────────────────────────────────────────────

function UploadProofModal({ onClose }: { onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [note, setNote] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return
        setSubmitted(true)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Proof of Work</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Submit evidence of your completed work</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-7 py-6">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                                <CheckCircle size={28} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Proof Submitted!</h3>
                                <p className="text-sm text-gray-500 mt-1">The NGO will review your proof and process payment accordingly.</p>
                            </div>
                            <Button onClick={onClose} className="rounded-full px-8 mt-2">Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* File upload */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Upload File <span className="text-red-500">*</span></label>
                                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all ${file ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
                                    }`}>
                                    <Upload size={24} className={file ? "text-black" : "text-gray-400"} />
                                    <span className="text-sm text-gray-500">
                                        {file ? file.name : "Click to upload photo or document"}
                                    </span>
                                    <span className="text-xs text-gray-400">JPG, PNG, PDF up to 10MB</span>
                                    <input type="file" className="hidden" accept="image/*,.pdf"
                                        onChange={e => setFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>

                            {/* Note */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                                    placeholder="Describe what work was done..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all resize-none" />
                            </div>

                            <Button type="submit" disabled={!file} className="rounded-full h-11 font-semibold mt-1">
                                Submit Proof
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── NGO Dashboard ────────────────────────────────────────────────────────────

function NGODashboard() {
    const [showPostJob, setShowPostJob] = useState(false)
    const [expandedJob, setExpandedJob] = useState<number | null>(null)

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Help India Foundation</h1>
                </div>
                <Button onClick={() => setShowPostJob(true)} className="rounded-full px-6 font-semibold gap-2">
                    <Plus size={16} /> Post a Job
                </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { icon: Briefcase, label: "Active Jobs", value: "1" },
                    { icon: Users, label: "Total Workers", value: "15" },
                    { icon: FileCheck, label: "Jobs Completed", value: "1" },
                    { icon: Building2, label: "Departments", value: "2" },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
                        <Icon size={18} className="text-muted-foreground" />
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* Posted Jobs */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Posted Jobs</h2>
                <div className="flex flex-col gap-4">
                    {fakePostedJobs.map(job => (
                        <div key={job.id} className="bg-card border border-border rounded-2xl overflow-hidden">

                            {/* Job header */}
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${job.status === "active"
                                            ? "bg-green-50 text-green-700 border border-green-200"
                                            : "bg-gray-100 text-gray-500 border border-gray-200"
                                            }`}>
                                            {job.status === "active" ? "Active" : "Closed"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Building2 size={11} />{job.department}</span>
                                        <span className="flex items-center gap-1"><Users size={11} />{job.filled}/{job.positions} filled</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} />{job.salary}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
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

                            {/* Workers list */}
                            {expandedJob === job.id && (
                                <div className="border-t border-border bg-muted/20 px-5 py-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workers Assigned</p>
                                    {job.workers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No workers assigned yet.</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {job.workers.map((w, i) => (
                                                <div key={i} className="flex items-center justify-between bg-background rounded-xl px-4 py-3 border border-border">
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">{w.name}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <MapPin size={10} />{w.location}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                                        <a href={`tel:${w.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                            <Phone size={12} />{w.phone}
                                                        </a>
                                                        <a href={`mailto:${w.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                            <Mail size={12} />{w.email}
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showPostJob && <PostJobModal onClose={() => setShowPostJob(false)} />}
        </div>
    )
}

// ─── Worker Dashboard ─────────────────────────────────────────────────────────

function WorkerDashboard() {
    const [showCompleted, setShowCompleted] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState({ minSalary: "", position: "", experience: "" })

    const setFilter = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const filteredJobs = fakeAvailableJobs.filter(job => {
        const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.department.toLowerCase().includes(search.toLowerCase())
        const matchSalary = !filters.minSalary || job.salary >= parseInt(filters.minSalary)
        const matchExp = !filters.experience || job.experience === filters.experience
        return matchSearch && matchSalary && matchExp
    })

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Ravi Kumar</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setShowUpload(true)} className="rounded-full gap-2 font-medium">
                        <Upload size={15} /> Upload Proof
                    </Button>
                    <Button variant="outline" onClick={() => setShowCompleted(true)} className="rounded-full gap-2 font-medium">
                        <CheckCircle size={15} /> Completed Jobs
                    </Button>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search jobs by title or department..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-xl gap-2 font-medium ${showFilters ? "border-foreground" : ""}`}>
                    <Filter size={15} /> Filters
                    {(filters.minSalary || filters.experience) && (
                        <span className="w-2 h-2 rounded-full bg-foreground" />
                    )}
                </Button>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="bg-card border border-border rounded-2xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min. Salary (₹)</label>
                        <input name="minSalary" type="number" value={filters.minSalary} onChange={setFilter}
                            placeholder="e.g. 15000"
                            className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</label>
                        <select name="experience" value={filters.experience} onChange={setFilter}
                            className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none">
                            <option value="">Any</option>
                            {["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"].map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => setFilters({ minSalary: "", position: "", experience: "" })}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Clear filters
                        </button>
                    </div>
                </div>
            )}

            {/* Jobs list */}
            <h2 className="text-lg font-bold text-foreground mb-4">
                Available Jobs <span className="text-muted-foreground font-normal text-base">({filteredJobs.length})</span>
            </h2>

            {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <AlertCircle size={32} className="text-muted-foreground" />
                    <p className="text-muted-foreground">No jobs match your filters.</p>
                    <button onClick={() => { setSearch(""); setFilters({ minSalary: "", position: "", experience: "" }) }}
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
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                                            {job.positions} open
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{job.ngo}</p>
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Building2 size={11} />{job.department}</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} />₹{job.salary.toLocaleString()}/month</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
                                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                                    </div>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.education}</span>
                                        <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.experience}</span>
                                    </div>
                                </div>
                                <Button size="sm" className="rounded-full px-5 flex-shrink-0 font-semibold">
                                    Apply
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Jobs Modal */}
            {showCompleted && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompleted(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">My Jobs</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Current and completed jobs</p>
                            </div>
                            <button onClick={() => setShowCompleted(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-4">
                            {fakeCompletedJobs.map(job => (
                                <div key={job.id} className={`rounded-2xl border p-5 ${job.status === "current" ? "border-black bg-gray-50" : "border-gray-200"
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${job.status === "current"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-green-50 text-green-700 border-green-200"
                                            }`}>
                                            {job.status === "current" ? "In Progress" : "Completed"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{job.ngo}</p>
                                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} />Earned: {job.earned}</span>
                                        <span className="flex items-center gap-1"><CheckCircle size={11} />{job.completedOn}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showUpload && <UploadProofModal onClose={() => setShowUpload(false)} />}
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
    // TODO: replace this toggle with real role from JWT token
    // const role = getUserRoleFromToken()  →  "ngo" | "worker"
    const [role, setRole] = useState<"ngo" | "worker">("ngo")

    return (
        <div className="min-h-screen bg-background pt-24">

            {/* Temporary role switcher — remove when backend is ready */}
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-foreground text-background rounded-full px-4 py-2 shadow-lg text-xs font-semibold">
                <span className="text-background/60">View as:</span>
                <button onClick={() => setRole("ngo")}
                    className={`px-2.5 py-1 rounded-full transition-all ${role === "ngo" ? "bg-background text-foreground" : "text-background/60 hover:text-background"}`}>
                    NGO
                </button>
                <span className="text-background/30">|</span>
                <button onClick={() => setRole("worker")}
                    className={`px-2.5 py-1 rounded-full transition-all ${role === "worker" ? "bg-background text-foreground" : "text-background/60 hover:text-background"}`}>
                    Worker
                </button>
            </div>

            {role === "ngo" ? <NGODashboard /> : <WorkerDashboard />}
        </div>
    )
}

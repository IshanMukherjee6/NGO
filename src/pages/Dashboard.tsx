import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"

// ─── Reusable label ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-sm font-medium text-foreground">
            {children} <span className="text-red-500">*</span>
        </label>
    )
}

// ─── Reusable shadcn Select field ─────────────────────────────────────────────

function SelectField({
    label, value, onValueChange, placeholder, options,
}: {
    label: string
    value: string
    onValueChange: (val: string) => void
    placeholder: string
    options: string[]
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
                        <SelectItem
                            key={o}
                            value={o}
                            className="rounded-lg text-sm cursor-pointer focus:bg-accent focus:text-accent-foreground"
                        >
                            {o}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

// ─── Post Job Modal ───────────────────────────────────────────────────────────

function PostJobModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        title: "", department: "", positions: "", education: "",
        experience: "", salary: "", duration: "",
    })
    const [submitted, setSubmitted] = useState(false)

    const setField = (name: string, value: string) =>
        setForm(prev => ({ ...prev, [name]: value }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.department || !form.education || !form.experience || !form.duration) {
            alert("Please fill in all required fields.")
            return
        }
        setSubmitted(true)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-visible">

                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Post a New Job</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Fill in the job details below</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
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

                            {/* Job Title */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Job Title</Label>
                                <input
                                    value={form.title}
                                    onChange={e => setField("title", e.target.value)}
                                    required placeholder="e.g. Field Survey Associate"
                                    className={inputCls}
                                />
                            </div>

                            {/* Department */}
                            <SelectField
                                label="Department"
                                value={form.department}
                                onValueChange={v => setField("department", v)}
                                placeholder="Select Department"
                                options={["Operations", "Health", "Training", "Admin", "Finance", "Research"]}
                            />

                            {/* Positions + Salary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>No. of Positions</Label>
                                    <input
                                        type="number" min="1"
                                        value={form.positions}
                                        onChange={e => setField("positions", e.target.value)}
                                        required placeholder="e.g. 20"
                                        className={inputCls}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Expected Salary</Label>
                                    <input
                                        value={form.salary}
                                        onChange={e => setField("salary", e.target.value)}
                                        required placeholder="e.g. ₹18,000/month"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* Education + Experience */}
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Education"
                                    value={form.education}
                                    onValueChange={v => setField("education", v)}
                                    placeholder="Select"
                                    options={["8th Pass", "10th Pass", "12th Pass", "Graduate", "Post Graduate"]}
                                />
                                <SelectField
                                    label="Experience"
                                    value={form.experience}
                                    onValueChange={v => setField("experience", v)}
                                    placeholder="Select"
                                    options={["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"]}
                                />
                            </div>

                            {/* Duration */}
                            <SelectField
                                label="Duration"
                                value={form.duration}
                                onValueChange={v => setField("duration", v)}
                                placeholder="Select Duration"
                                options={["1 month", "2 months", "3 months", "6 months", "1 year", "Ongoing"]}
                            />

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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Upload File <span className="text-red-500">*</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all ${file ? "border-foreground bg-muted/20" : "border-border hover:border-muted-foreground"
                                    }`}>
                                    <Upload size={24} className={file ? "text-foreground" : "text-muted-foreground"} />
                                    <span className="text-sm text-muted-foreground">
                                        {file ? file.name : "Click to upload photo or document"}
                                    </span>
                                    <span className="text-xs text-muted-foreground/60">JPG, PNG, PDF up to 10MB</span>
                                    <input type="file" className="hidden" accept="image/*,.pdf"
                                        onChange={e => setFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Note (optional)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                                    placeholder="Describe what work was done..."
                                    className={`${inputCls} resize-none`} />
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Help India Foundation</h1>
                </div>
                <Button onClick={() => setShowPostJob(true)} className="rounded-full px-6 font-semibold gap-2">
                    <Plus size={16} /> Post a Job
                </Button>
            </div>

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

            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Posted Jobs</h2>
                <div className="flex flex-col gap-4">
                    {fakePostedJobs.map(job => (
                        <div key={job.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${job.status === "active"
                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                            : "bg-muted text-muted-foreground border-border"
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
    const [filters, setFilters] = useState({ minSalary: "", experience: "" })

    const filteredJobs = fakeAvailableJobs.filter(job => {
        const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.department.toLowerCase().includes(search.toLowerCase())
        const matchSalary = !filters.minSalary || job.salary >= parseInt(filters.minSalary)
        const matchExp = !filters.experience || job.experience === filters.experience
        return matchSearch && matchSalary && matchExp
    })

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
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
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search jobs by title or department..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-xl gap-2 font-medium ${showFilters ? "border-foreground" : ""}`}>
                    <Filter size={15} /> Filters
                    {(filters.minSalary || filters.experience) && (
                        <span className="w-2 h-2 rounded-full bg-foreground" />
                    )}
                </Button>
            </div>

            {/* Filter panel — uses shadcn Select too */}
            {showFilters && (
                <div className="bg-card border border-border rounded-2xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min. Salary (₹)</label>
                        <input name="minSalary" type="number" min="0" value={filters.minSalary}
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
                                <Button size="sm" className="rounded-full px-5 flex-shrink-0 font-semibold">Apply</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Jobs Modal */}
            {showCompleted && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompleted(false)} />
                    <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">My Jobs</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">Current and completed jobs</p>
                            </div>
                            <button onClick={() => setShowCompleted(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-4">
                            {fakeCompletedJobs.map(job => (
                                <div key={job.id} className={`rounded-2xl border p-5 ${job.status === "current" ? "border-foreground bg-muted/20" : "border-border bg-card"
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${job.status === "current"
                                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            : "bg-green-500/10 text-green-500 border-green-500/20"
                                            }`}>
                                            {job.status === "current" ? "In Progress" : "Completed"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{job.ngo}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
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
    // TODO: replace with real role from JWT token when backend is ready
    const [role, setRole] = useState<"ngo" | "worker">("ngo")

    return (
        <div className="min-h-screen bg-background pt-24">

            {/* Temp role switcher — delete when backend is ready */}
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
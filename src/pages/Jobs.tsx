import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Building2, Clock, DollarSign, MapPin,
    Search, Filter, X, LogIn, UserPlus, AlertCircle
} from "lucide-react"

// ─── Fake data (same as worker dashboard — will come from API later) ──────────

const allJobs = [
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
    {
        id: 4,
        title: "Community Health Worker",
        ngo: "Seva Foundation",
        department: "Health",
        positions: 25,
        salary: 16000,
        duration: "6 months",
        education: "12th Pass",
        experience: "0-1 years",
        location: "Nashik, Maharashtra",
    },
    {
        id: 5,
        title: "Rural Education Coordinator",
        ngo: "GreenEarth NGO",
        department: "Education",
        positions: 10,
        salary: 22000,
        duration: "1 year",
        education: "Graduate",
        experience: "2-3 years",
        location: "Aurangabad, Maharashtra",
    },
]

// ─── Login prompt modal ───────────────────────────────────────────────────────

function LoginPrompt({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5">

                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <X size={16} />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <LogIn size={24} className="text-foreground" />
                </div>

                {/* Text */}
                <div>
                    <h2 className="text-xl font-bold text-foreground">Sign in to Apply</h2>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        You need a worker account to apply for jobs. Log in or create a free account to get started.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 w-full">
                    <Button
                        className="rounded-full h-11 font-semibold gap-2"
                        onClick={() => navigate("/login")}
                    >
                        <LogIn size={16} /> Log In
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-full h-11 font-semibold gap-2"
                        onClick={() => navigate("/register/worker")}
                    >
                        <UserPlus size={16} /> Create Worker Account
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Are you an NGO?{" "}
                    <button
                        onClick={() => navigate("/register/ngo")}
                        className="text-foreground font-semibold hover:underline"
                    >
                        Register here
                    </button>
                </p>
            </div>
        </div>
    )
}

// ─── Main Jobs page ───────────────────────────────────────────────────────────

export default function Jobs() {
    const [search, setSearch] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({ minSalary: "", experience: "" })
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    const filteredJobs = allJobs.filter(job => {
        const matchSearch =
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.ngo.toLowerCase().includes(search.toLowerCase()) ||
            job.department.toLowerCase().includes(search.toLowerCase()) ||
            job.location.toLowerCase().includes(search.toLowerCase())
        const matchSalary = !filters.minSalary || job.salary >= parseInt(filters.minSalary)
        const matchExp = !filters.experience || job.experience === filters.experience
        return matchSearch && matchSalary && matchExp
    })

    return (
        <div className="min-h-screen bg-background pt-28 pb-16">
            <div className="max-w-5xl mx-auto px-6 md:px-10">

                {/* Page header */}
                <div className="mb-8">
                    <p className="text-xs tracking-widest uppercase text-muted-foreground font-semibold mb-2">
                        Open Positions
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Find NGO Jobs Near You
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base">
                        Browse available positions posted by NGOs. Create a free worker account to apply.
                    </p>
                </div>

                {/* Search + Filter bar */}
                <div className="flex gap-3 mb-5 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by title, NGO, department or location..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`rounded-xl gap-2 font-medium ${showFilters ? "border-foreground" : ""}`}
                    >
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
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Min. Salary (₹)
                            </label>
                            <input
                                type="number" min="0"
                                value={filters.minSalary}
                                onChange={e => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                                placeholder="e.g. 15000"
                                className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Experience
                            </label>
                            <select
                                value={filters.experience}
                                onChange={e => setFilters(prev => ({ ...prev, experience: e.target.value }))}
                                className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Any</option>
                                {["Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years", "5+ years"].map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ minSalary: "", experience: "" })}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Results count */}
                <p className="text-sm text-muted-foreground mb-4">
                    Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of {allJobs.length} jobs
                </p>

                {/* Job cards */}
                {filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <AlertCircle size={32} className="text-muted-foreground" />
                        <p className="text-muted-foreground">No jobs match your search.</p>
                        <button
                            onClick={() => { setSearch(""); setFilters({ minSalary: "", experience: "" }) }}
                            className="text-sm text-foreground font-semibold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Title + badge */}
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-foreground">{job.title}</h3>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 font-medium">
                                                {job.positions} open
                                            </span>
                                        </div>

                                        {/* NGO name */}
                                        <p className="text-sm text-muted-foreground mb-3">{job.ngo}</p>

                                        {/* Meta info */}
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Building2 size={11} />{job.department}</span>
                                            <span className="flex items-center gap-1"><DollarSign size={11} />₹{job.salary.toLocaleString()}/month</span>
                                            <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>
                                            <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.education}</span>
                                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg text-muted-foreground">{job.experience}</span>
                                        </div>
                                    </div>

                                    {/* Apply button — triggers login prompt */}
                                    <Button
                                        size="sm"
                                        className="rounded-full px-5 flex-shrink-0 font-semibold"
                                        onClick={() => setShowLoginPrompt(true)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom CTA for non-logged-in users */}
                <div className="mt-12 p-8 rounded-2xl border border-border bg-muted/20 text-center">
                    <h3 className="font-bold text-lg text-foreground mb-2">Ready to get started?</h3>
                    <p className="text-muted-foreground text-sm mb-5">
                        Create a free worker account to apply for jobs and get matched based on your location.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Button className="rounded-full px-6 font-semibold gap-2" onClick={() => setShowLoginPrompt(true)}>
                            <UserPlus size={15} /> Create Account
                        </Button>
                        <Button variant="outline" className="rounded-full px-6 font-semibold gap-2" onClick={() => setShowLoginPrompt(true)}>
                            <LogIn size={15} /> Log In
                        </Button>
                    </div>
                </div>
            </div>

            {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
        </div>
    )
}

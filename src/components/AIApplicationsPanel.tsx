// src/components/AIApplicationsPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NGO view: Shows all applicants for a job with AI scores and rank badges
// Premium NGOs see full scores + filters. Free NGOs see rank only.
//
// FIXES APPLIED:
//   • useEffect now logs fetched data and errors to console for easy debugging.
//   • Added a "Rescore" button so NGOs can manually trigger AI scoring for
//     applicants who were scored before Gemini was working correctly.
//   • Applicants with no score (null) now show a "Pending Score" badge instead
//     of a broken "?" rank — makes it clear scoring is still in progress.
//   • Added an overall error state so if fetchScoredApplications fails, the
//     panel shows a helpful message instead of just an empty list.
//   • scoreWorkerForJob is imported so the Rescore button works directly.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import {
    Loader2, MapPin, Phone, ChevronDown,
    ChevronUp, Sparkles, Lock, CheckCircle, XCircle,
    AlertTriangle, Shield, TrendingUp, RefreshCw, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "../context/ToastContext"
import {
    fetchScoredApplications,
    scoreWorkerForJob,
    getRankColor,
    type JobApplicationScore,
} from "../lib/scoringService"
import { updateApplicationStatus } from "../lib/jobService"

interface Props {
    jobId: string
    jobTitle: string
    isPremiumNGO: boolean
    onClose: () => void
    onStatusChange: () => void
}

interface ScoredApp {
    application: {
        id: string
        workerName: string
        workerPhone: string
        workerLocation: string
        workerId: string
        status: string
        [key: string]: unknown
    }
    score: JobApplicationScore | null
}

export default function AIApplicationsPanel({
    jobId, jobTitle, isPremiumNGO, onClose, onStatusChange,
}: Props) {
    const { showToast } = useToast()
    const [apps, setApps] = useState<ScoredApp[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [rescoringId, setRescoringId] = useState<string | null>(null)
    const [skillFilter, setSkillFilter] = useState("")
    const [rankFilter, setRankFilter] = useState<string>("all")

    // ── Load applications ─────────────────────────────────────────────────────

    const loadApps = useCallback(() => {
        setLoading(true)
        setError(null)

        fetchScoredApplications(jobId)
            .then(data => {
                // FIX: Log fetched data so you can verify in DevTools → Console
                console.log(`✅ AIApplicationsPanel: loaded ${data.length} apps for jobId=${jobId}`, data)
                setApps(data as ScoredApp[])
            })
            .catch(err => {
                // FIX: Log the actual error so it's visible in console
                console.error("❌ AIApplicationsPanel: fetchScoredApplications failed:", err)
                setError("Could not load applications. Check console for details.")
                showToast("Failed to load applications", "error")
            })
            .finally(() => setLoading(false))
    }, [jobId])

    useEffect(() => {
        loadApps()
    }, [loadApps])

    // ── Accept / Reject ───────────────────────────────────────────────────────

    const handleAccept = async (appId: string, workerId: string) => {
        setActionLoading(appId)
        try {
            await updateApplicationStatus(appId, "accepted")
            showToast("Worker accepted!", "success")
            setApps(prev => prev.map(a =>
                a.application.id === appId
                    ? { ...a, application: { ...a.application, status: "accepted" } }
                    : a
            ))
            onStatusChange()
        } catch {
            showToast("Failed to update status", "error")
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (appId: string) => {
        setActionLoading(appId)
        try {
            await updateApplicationStatus(appId, "rejected")
            showToast("Application rejected", "success")
            setApps(prev => prev.map(a =>
                a.application.id === appId
                    ? { ...a, application: { ...a.application, status: "rejected" } }
                    : a
            ))
            onStatusChange()
        } catch {
            showToast("Failed to update status", "error")
        } finally {
            setActionLoading(null)
        }
    }

    // ── Rescore a single applicant ────────────────────────────────────────────
    // FIX: Added so NGOs can manually re-trigger AI scoring for an applicant
    // whose score is null (Gemini failed silently on first attempt).

    const handleRescore = async (app: ScoredApp) => {
        const appId = app.application.id
        const workerId = app.application.workerId as string
        setRescoringId(appId)
        try {
            const newScore = await scoreWorkerForJob(appId, workerId, jobId)
            showToast("Rescored successfully!", "success")
            setApps(prev => prev.map(a =>
                a.application.id === appId ? { ...a, score: newScore } : a
            ))
        } catch (err) {
            console.error("Rescore failed:", err)
            showToast("Rescore failed — check console", "error")
        } finally {
            setRescoringId(null)
        }
    }

    // ── Filters ───────────────────────────────────────────────────────────────

    const filteredApps = apps.filter(({ application, score }) => {
        if (rankFilter !== "all" && isPremiumNGO) {
            if (score?.rank !== rankFilter) return false
        }
        if (skillFilter && isPremiumNGO) {
            const name = application.workerName?.toLowerCase() || ""
            if (!name.includes(skillFilter.toLowerCase())) return false
        }
        return true
    })

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
                            <Sparkles size={16} className="text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">AI-Ranked Applicants</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{jobTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Refresh button */}
                        <button
                            onClick={loadApps}
                            disabled={loading}
                            title="Refresh applicants"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            {loading
                                ? <Loader2 size={15} className="animate-spin" />
                                : <RefreshCw size={15} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>

                {/* Premium Filters */}
                {isPremiumNGO && (
                    <div className="px-7 py-4 border-b border-border bg-muted/10 flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Shield size={13} className="text-yellow-400" />
                            <span className="text-xs font-semibold text-yellow-400">Premium Filters</span>
                        </div>
                        <select
                            value={rankFilter}
                            onChange={e => setRankFilter(e.target.value)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="all">All Ranks</option>
                            <option value="S">Rank S</option>
                            <option value="A">Rank A</option>
                            <option value="B">Rank B</option>
                            <option value="C">Rank C</option>
                        </select>
                        <input
                            value={skillFilter}
                            onChange={e => setSkillFilter(e.target.value)}
                            placeholder="Filter by name..."
                            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-[120px]"
                        />
                    </div>
                )}

                {/* Free NGO Notice */}
                {!isPremiumNGO && (
                    <div className="mx-7 mt-4 px-4 py-3 rounded-xl bg-muted/30 border border-border flex items-center gap-3">
                        <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Upgrade to Premium</span> to see full AI scores, breakdowns, and advanced filters.
                            You can still see worker ranks and accept/reject.
                        </p>
                    </div>
                )}

                {/* Applications List */}
                <div className="overflow-y-auto flex-1 px-7 py-5 flex flex-col gap-3">

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={24} className="animate-spin text-violet-400" />
                                <p className="text-xs text-muted-foreground">AI is scoring applicants…</p>
                            </div>
                        </div>
                    )}

                    {/* FIX: Error state — shows when fetchScoredApplications throws */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Failed to load applicants</p>
                                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={loadApps}
                                className="rounded-full text-xs gap-2"
                            >
                                <RefreshCw size={12} /> Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && filteredApps.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <p className="text-muted-foreground text-sm">No applicants found.</p>
                            <p className="text-xs text-muted-foreground">
                                Workers who apply for this job will appear here once scored.
                            </p>
                        </div>
                    )}

                    {/* Applicant cards */}
                    {!loading && !error && filteredApps.map(({ application, score }) => {
                        const isExpanded = expandedId === application.id
                        const isPending = application.status === "pending"
                        const hasScore = score !== null
                        const rankColors = getRankColor(score?.rank || "C")
                        const isRescoring = rescoringId === application.id

                        return (
                            <div
                                key={application.id}
<<<<<<< HEAD
                                className={`rounded-2xl border transition-all ${
                                    application.status === "accepted"
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : application.status === "rejected"
                                        ? "border-red-500/20 bg-red-500/5 opacity-60"
                                        : "border-border bg-card"
                                }`}
=======
                                className={`rounded-2xl border transition-all ${application.status === "accepted"
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : application.status === "rejected"
                                            ? "border-red-500/20 bg-red-500/5 opacity-60"
                                            : "border-border bg-card"
                                    }`}
>>>>>>> 0a39e6e (Final hai ye- Work on this from tmrw)
                            >
                                {/* Main Row */}
                                <div className="p-4 flex items-center gap-4">

                                    {/* Rank Badge — FIX: show clock icon when score is null */}
                                    {hasScore ? (
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm flex-shrink-0 ${rankColors}`}>
                                            {score!.rank}
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
                                            <Clock size={16} className="text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Worker Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm text-foreground truncate">
                                                {application.workerName}
                                            </p>

                                            {/* AI Pick badge */}
                                            {score?.recommended && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium flex items-center gap-1">
                                                    <Sparkles size={10} /> AI Pick
                                                </span>
                                            )}

                                            {/* FIX: Pending score badge when Gemini hasn't scored yet */}
                                            {!hasScore && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border font-medium flex items-center gap-1">
                                                    <Clock size={10} /> Pending Score
                                                </span>
                                            )}

                                            {/* Status badge */}
                                            {application.status !== "pending" && (
<<<<<<< HEAD
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                                    application.status === "accepted"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                }`}>
=======
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${application.status === "accepted"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    }`}>
>>>>>>> 0a39e6e (Final hai ye- Work on this from tmrw)
                                                    {application.status}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} />{application.workerLocation}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={10} />{application.workerPhone}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Score (Premium only) */}
                                    {isPremiumNGO && hasScore && (
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-foreground">{score!.aiScore}</p>
                                            <p className="text-xs text-muted-foreground">/ 100</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">

                                        {/* FIX: Rescore button for unscored applicants */}
                                        {!hasScore && isPending && (
                                            <button
                                                onClick={() => handleRescore({ application, score })}
                                                disabled={isRescoring}
                                                title="Trigger AI scoring"
                                                className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 hover:bg-violet-500/20 transition-all"
                                            >
                                                {isRescoring
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : <Sparkles size={13} />}
                                            </button>
                                        )}

                                        {/* Accept / Reject */}
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(application.id, application.workerId as string)}
                                                    disabled={actionLoading === application.id}
                                                    className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                >
                                                    {actionLoading === application.id
                                                        ? <Loader2 size={13} className="animate-spin" />
                                                        : <CheckCircle size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(application.id)}
                                                    disabled={actionLoading === application.id}
                                                    className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                                                >
                                                    <XCircle size={13} />
                                                </button>
                                            </>
                                        )}

                                        {/* Expand breakdown (Premium + scored only) */}
                                        {isPremiumNGO && hasScore && (
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : application.id)}
                                                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Score Breakdown (Premium only) */}
                                {isExpanded && isPremiumNGO && hasScore && (
                                    <div className="border-t border-border px-5 py-4 bg-muted/10">

                                        {/* Score bars */}
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                            Score Breakdown
                                        </p>
                                        <div className="flex flex-col gap-2.5">
                                            {[
                                                { label: "Location Match", value: score!.breakdown?.locationScore ?? 0, max: 25 },
<<<<<<< HEAD
                                                { label: "Liability",      value: score!.breakdown?.liabilityScore ?? 0, max: 25 },
                                                { label: "Skill Match",    value: score!.breakdown?.skillScore ?? 0,     max: 20 },
                                                { label: "Past Rating",    value: score!.breakdown?.ratingScore ?? 0,    max: 20 },
                                                { label: "Reliability",    value: score!.breakdown?.reliabilityScore ?? 0, max: 10 },
=======
                                                { label: "Liability", value: score!.breakdown?.liabilityScore ?? 0, max: 25 },
                                                { label: "Skill Match", value: score!.breakdown?.skillScore ?? 0, max: 20 },
                                                { label: "Past Rating", value: score!.breakdown?.ratingScore ?? 0, max: 20 },
                                                { label: "Reliability", value: score!.breakdown?.reliabilityScore ?? 0, max: 10 },
>>>>>>> 0a39e6e (Final hai ye- Work on this from tmrw)
                                            ].map(({ label, value, max }) => (
                                                <div key={label} className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                                                            style={{ width: `${(value / max) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-foreground w-10 text-right">
                                                        {value}/{max}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Match reasons */}
                                        {score!.matchReasons?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                    Why this worker?
                                                </p>
                                                <ul className="flex flex-col gap-1">
                                                    {score!.matchReasons.map((r, i) => (
                                                        <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                                            <TrendingUp size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Concerns */}
                                        {score!.concerns?.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                    Concerns
                                                </p>
                                                <ul className="flex flex-col gap-1">
                                                    {score!.concerns.map((c, i) => (
                                                        <li key={i} className="text-xs text-orange-400 flex items-start gap-2">
                                                            <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                                                            {c}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-7 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                        {filteredApps.length} applicant{filteredApps.length !== 1 ? "s" : ""} · Sorted by AI score
                    </p>
                    <Button variant="outline" onClick={onClose} className="rounded-full text-sm">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
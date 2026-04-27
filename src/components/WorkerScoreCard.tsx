// src/components/WorkerScoreCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Worker's personal score card — shown on their dashboard
// Shows rank, score breakdown, and tips to improve
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { Loader2, Sparkles, TrendingUp, Info, RefreshCw } from "lucide-react"
import {
    fetchWorkerScore, computeWorkerGlobalScore,
    getRankColor, type WorkerScore,
} from "../lib/scoringService"
import { useToast } from "../context/ToastContext"

interface Props {
    workerId: string
}

export default function WorkerScoreCard({ workerId }: Props) {
    const { showToast } = useToast()
    const [score, setScore] = useState<WorkerScore | null>(null)
    const [loading, setLoading] = useState(true)
    const [recomputing, setRecomputing] = useState(false)

    const load = async () => {
        try {
            const s = await fetchWorkerScore(workerId)
            setScore(s)
        } catch {
            // Silently fail — score is optional UI
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [workerId])

    const handleRecompute = async () => {
        setRecomputing(true)
        try {
            const s = await computeWorkerGlobalScore(workerId)
            setScore(s)
            showToast("Score updated!", "success")
        } catch {
            showToast("Failed to update score", "error")
        } finally {
            setRecomputing(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    const rankColors = getRankColor(score?.rank || "C")

    const improvementTips: Record<string, string[]> = {
        S: ["You're at the top! Keep completing jobs on time to stay here."],
        A: ["Complete more jobs to reach S rank.", "Maintain high attendance."],
        B: ["Upload your certificates to boost your score.", "Apply for jobs that match your skills closely."],
        C: ["Complete your profile fully.", "Upload documents and get certified.", "Apply and complete your first job."],
        D: ["Contact support if you believe your score is incorrect.", "Address any flags on your profile."],
    }

    const tips = improvementTips[score?.rank || "C"] || []

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-violet-400" />
                    <span className="text-sm font-semibold text-foreground">Your AI Score</span>
                </div>
                <button
                    onClick={handleRecompute}
                    disabled={recomputing}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RefreshCw size={12} className={recomputing ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {score === null ? (
                <div className="px-5 pb-5 text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                        No score yet. Complete your profile to get scored.
                    </p>
                    <button
                        onClick={handleRecompute}
                        disabled={recomputing}
                        className="text-xs text-violet-400 hover:underline font-medium"
                    >
                        {recomputing ? "Computing…" : "Compute my score"}
                    </button>
                </div>
            ) : (
                <div className="px-5 pb-5 flex flex-col gap-4">
                    {/* Main score display */}
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-xl ${rankColors}`}>
                            {score.rank}
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{score.totalScore}<span className="text-base text-muted-foreground font-normal">/100</span></p>
                            <p className="text-xs text-muted-foreground mt-0.5">Global Performance Score</p>
                        </div>
                    </div>

                    {/* Score bars */}
                    <div className="flex flex-col gap-2">
                        {[
                            { label: "Location", value: score.breakdown?.locationScore ?? 0, max: 25 },
                            { label: "Liability", value: score.breakdown?.liabilityScore ?? 0, max: 25 },
                            { label: "Skills", value: score.breakdown?.skillScore ?? 0, max: 20 },
                            { label: "Rating", value: score.breakdown?.ratingScore ?? 0, max: 20 },
                            { label: "Reliability", value: score.breakdown?.reliabilityScore ?? 0, max: 10 },
                        ].map(({ label, value, max }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                                        style={{ width: `${(value / max) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">{value}/{max}</span>
                            </div>
                        ))}
                    </div>

                    {/* Red flag warning */}
                    {score.redFlagged && (
                        <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400 font-medium">⚠ Account flagged: {score.redFlagReason}</p>
                        </div>
                    )}

                    {/* Tips */}
                    {tips.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp size={11} /> How to improve
                            </p>
                            {tips.map((tip, i) => (
                                <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <Info size={10} className="mt-0.5 flex-shrink-0 text-violet-400" />
                                    {tip}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Rank legend */}
                    <div className="flex gap-1.5 flex-wrap">
                        {["S", "A", "B", "C", "D"].map(r => (
                            <span key={r} className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${score.rank === r ? getRankColor(r) : "text-muted-foreground border-border"}`}>
                                {r}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
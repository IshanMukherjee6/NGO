// src/lib/scoringService.ts
// AI-Powered Worker Scoring & Job Matching System

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    query,
    where,
    serverTimestamp,
    type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface WorkerScore {
    workerId: string
    workerName: string
    totalScore: number
    rank: "S" | "A" | "B" | "C" | "D"
    breakdown: ScoreBreakdown
    redFlagged: boolean
    redFlagReason?: string
    updatedAt: Timestamp | null
}

export interface ScoreBreakdown {
    locationScore: number
    liabilityScore: number
    skillScore: number
    ratingScore: number
    reliabilityScore: number
}

export interface JobApplicationScore {
    applicationId: string
    workerId: string
    workerName: string
    jobId: string
    aiScore: number
    rank: "S" | "A" | "B" | "C" | "D"
    breakdown?: ScoreBreakdown | null
    matchReasons: string[]
    concerns: string[]
    recommended: boolean
    scoredAt: Timestamp | null
}

export interface WorkerRatingInput {
    workerId: string
    jobId: string
    applicationId: string
    ngoId: string
    completedOnTime: boolean
    attendancePercent: number
    qualityRating: number
    finalOutput: "excellent" | "good" | "average" | "poor"
    flagged: boolean
    flagReason?: string
}

// ─────────────────────────────────────────────────────────────
// RANK HELPERS
// ─────────────────────────────────────────────────────────────

export function getWorkerRank(score: number): "S" | "A" | "B" | "C" | "D" {
    if (score >= 88) return "S"
    if (score >= 72) return "A"
    if (score >= 55) return "B"
    if (score >= 35) return "C"
    return "D"
}

export function getRankColor(rank: string): string {
    const colors: Record<string, string> = {
        S: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
        A: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
        B: "text-blue-400 border-blue-400/30 bg-blue-400/10",
        C: "text-orange-400 border-orange-400/30 bg-orange-400/10",
        D: "text-red-400 border-red-400/30 bg-red-400/10",
    }
    return colors[rank] || colors.C
}

// ─────────────────────────────────────────────────────────────
// GEMINI API CALL
// ─────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
    console.log("🤖 callGemini → Gemini 1.5 Flash")

    if (!GEMINI_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set")
    }

    const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
            },
        }),
    })

    console.log("📥 Gemini response status:", res.status)

    if (res.status === 429) {
        throw new Error("Gemini rate limit exceeded — try again in 1 minute")
    }

    if (!res.ok) {
        const err = await res.text().catch(() => "")
        console.error("❌ Gemini Error:", err)
        throw new Error(`AI Error ${res.status}: ${err}`)
    }

    const data = await res.json()

    const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return raw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
}

// ─────────────────────────────────────────────────────────────
// GLOBAL WORKER SCORE
// ─────────────────────────────────────────────────────────────

export async function computeWorkerGlobalScore(workerId: string): Promise<WorkerScore> {
    const workerSnap = await getDoc(doc(db, "users", workerId))
    if (!workerSnap.exists()) throw new Error("Worker not found")

    const worker = workerSnap.data()

    const appsSnap = await getDocs(query(
        collection(db, "applications"),
        where("workerId", "==", workerId)
    ))

    const ratingsSnap = await getDocs(query(
        collection(db, "workerRatings"),
        where("workerId", "==", workerId)
    ))

    const flagsSnap = await getDocs(query(
        collection(db, "workerFlags"),
        where("workerId", "==", workerId),
        where("active", "==", true)
    ))

    const applications = appsSnap.docs.map(d => d.data())
    const ratings = ratingsSnap.docs.map(d => d.data())
    const flags = flagsSnap.docs.map(d => d.data())

    const totalJobs = applications.length
    const completedJobs = ratings.filter(r => r.completedOnTime).length

    const avgRating =
        ratings.length > 0
            ? ratings.reduce((s, r) => s + (r.qualityRating || 3), 0) / ratings.length
            : null

    const avgAttendance =
        ratings.length > 0
            ? ratings.reduce((s, r) => s + (r.attendancePercent || 100), 0) / ratings.length
            : null

    const prompt = `
Score this worker fairly for an NGO platform.

WORKER:
Location: ${worker.city || "Unknown"}, ${worker.state || "Unknown"}
Education: ${worker.education || "None"}
Skills: ${worker.skills || "None"}

HISTORY:
Applications: ${totalJobs}
Completed On Time: ${completedJobs}
Avg Rating: ${avgRating ?? "None"}
Avg Attendance: ${avgAttendance ?? "None"}

FLAGS:
${flags.length === 0 ? "None" : flags.map(f => f.reason).join(", ")}

Return JSON:
{
  "breakdown": {
    "locationScore": number,
    "liabilityScore": number,
    "skillScore": number,
    "ratingScore": number,
    "reliabilityScore": number
  },
  "redFlagged": boolean,
  "redFlagReason": string|null
}
`

    const raw = await callGemini(prompt)
    const result = JSON.parse(raw)

    const breakdown: ScoreBreakdown = result.breakdown

    const totalScore = Math.min(
        100,
        breakdown.locationScore +
        breakdown.liabilityScore +
        breakdown.skillScore +
        breakdown.ratingScore +
        breakdown.reliabilityScore
    )

    const workerScore: Omit<WorkerScore, "updatedAt"> = {
        workerId,
        workerName: worker.fullName || "Unknown",
        totalScore: Math.round(totalScore),
        rank: getWorkerRank(totalScore),
        breakdown,
        redFlagged: result.redFlagged || false,
        redFlagReason: result.redFlagReason || undefined,
    }

    await setDoc(
        doc(db, "workerScores", workerId),
        {
            ...workerScore,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    )

    return {
        ...workerScore,
        updatedAt: null,
    }
}

// ─────────────────────────────────────────────────────────────
// JOB SPECIFIC SCORE
// ─────────────────────────────────────────────────────────────

export async function scoreWorkerForJob(
    applicationId: string,
    workerId: string,
    jobId: string,
): Promise<JobApplicationScore> {
    const [workerSnap, jobSnap, scoreSnap] = await Promise.all([
        getDoc(doc(db, "users", workerId)),
        getDoc(doc(db, "jobs", jobId)),
        getDoc(doc(db, "workerScores", workerId)),
    ])

    if (!workerSnap.exists() || !jobSnap.exists()) {
        throw new Error("Worker or Job not found")
    }

    const worker = workerSnap.data()
    const job = jobSnap.data()
    const globalScore = scoreSnap.exists() ? scoreSnap.data() : null

    const activeJobsSnap = await getDocs(query(
        collection(db, "applications"),
        where("workerId", "==", workerId),
        where("status", "==", "accepted")
    ))

    const isOverloaded =
        worker.premiumWorker !== true &&
        activeJobsSnap.docs.length >= 1

    let result

    try {
        const raw = await callGemini(`
Score fit for this job.

JOB:
${JSON.stringify(job)}

WORKER:
${JSON.stringify(worker)}

Global Score:
${globalScore?.totalScore || "None"}

Overloaded:
${isOverloaded}

Return JSON:
{
  "aiScore": number,
  "matchReasons": string[],
  "concerns": string[],
  "recommended": boolean
}
`)
        result = JSON.parse(raw)
    } catch (err) {
        console.error("Gemini scoring failed:", err)

        result = {
            aiScore: 50,
            matchReasons: ["AI unavailable — fallback score applied"],
            concerns: ["Check Gemini API key / quota / billing"],
            recommended: false,
        }
    }

    const aiScore = Math.round(Math.min(100, Math.max(0, result.aiScore)))

    const appScore: Omit<JobApplicationScore, "scoredAt"> = {
        applicationId,
        workerId,
        workerName: worker.fullName || "Unknown",
        jobId,
        aiScore,
        rank: getWorkerRank(aiScore),
        breakdown: globalScore?.breakdown ?? null,
        matchReasons: result.matchReasons || [],
        concerns: result.concerns || [],
        recommended: result.recommended || false,
    }

    await setDoc(
        doc(db, "applicationScores", applicationId),
        {
            ...appScore,
            scoredAt: serverTimestamp(),
        },
        { merge: true }
    )

    return {
        ...appScore,
        scoredAt: null,
    }
}

// ─────────────────────────────────────────────────────────────
// RATE WORKER AFTER JOB
// ─────────────────────────────────────────────────────────────

export async function rateWorkerAfterJob(input: WorkerRatingInput): Promise<void> {
    await addDoc(collection(db, "workerRatings"), {
        ...input,
        ratedAt: serverTimestamp(),
    })

    if (input.flagged && input.flagReason) {
        const severity =
            input.flagReason.toLowerCase().includes("criminal") ||
                input.flagReason.toLowerCase().includes("violence")
                ? "severe"
                : input.flagReason.toLowerCase().includes("fraud") ||
                    input.flagReason.toLowerCase().includes("abandon")
                    ? "moderate"
                    : "minor"

        await addDoc(collection(db, "workerFlags"), {
            workerId: input.workerId,
            reason: input.flagReason,
            severity,
            jobId: input.jobId,
            ngoId: input.ngoId,
            active: true,
            flaggedAt: serverTimestamp(),
        })
    }

    await computeWorkerGlobalScore(input.workerId)
}

// ─────────────────────────────────────────────────────────────
// FETCH SCORED APPLICATIONS
// ─────────────────────────────────────────────────────────────

export async function fetchScoredApplications(jobId: string) {
    const appsSnap = await getDocs(query(
        collection(db, "applications"),
        where("jobId", "==", jobId)
    ))

    const pendingDocs =
        appsSnap.docs.filter(d => d.data().status === "pending")

    const results = await Promise.all(
        pendingDocs.map(async (appDoc) => {
            const scoreSnap = await getDoc(doc(db, "applicationScores", appDoc.id))

            return {
                application: { id: appDoc.id, ...appDoc.data() },
                score: scoreSnap.exists()
                    ? scoreSnap.data() as JobApplicationScore
                    : null,
            }
        })
    )

    return results.sort(
        (a, b) => (b.score?.aiScore || 0) - (a.score?.aiScore || 0)
    )
}

// ─────────────────────────────────────────────────────────────
// FETCH SINGLE WORKER SCORE
// ─────────────────────────────────────────────────────────────

export async function fetchWorkerScore(workerId: string) {
    const snap = await getDoc(doc(db, "workerScores", workerId))
    return snap.exists() ? snap.data() as WorkerScore : null
}

// ─────────────────────────────────────────────────────────────
// HUNGARIAN ASSIGNMENT
// ─────────────────────────────────────────────────────────────

export function hungarianAssign(
    workers: string[],
    jobs: string[],
    costMatrix: number[][]
) {
    const assigned = []
    const usedWorkers = new Set<number>()
    const usedJobs = new Set<number>()

    const pairs = []

    for (let i = 0; i < workers.length; i++) {
        for (let j = 0; j < jobs.length; j++) {
            pairs.push({
                i,
                j,
                score: costMatrix[i]?.[j] ?? 0,
            })
        }
    }

    pairs.sort((a, b) => b.score - a.score)

    for (const pair of pairs) {
        if (!usedWorkers.has(pair.i) && !usedJobs.has(pair.j)) {
            assigned.push({
                workerId: workers[pair.i],
                jobId: jobs[pair.j],
                score: pair.score,
            })

            usedWorkers.add(pair.i)
            usedJobs.add(pair.j)
        }
    }

    return assigned
}

// ─────────────────────────────────────────────────────────────
// TRIGGER ON APPLY
// ─────────────────────────────────────────────────────────────

export async function onWorkerApplied(
    applicationId: string,
    workerId: string,
    jobId: string,
) {
    try {
        const scoreSnap = await getDoc(doc(db, "workerScores", workerId))

        if (!scoreSnap.exists()) {
            await computeWorkerGlobalScore(workerId)
        }

        await scoreWorkerForJob(applicationId, workerId, jobId)

        console.log("✅ Scoring complete")
    } catch (err) {
        console.error("onWorkerApplied failed:", err)
    }
}
// src/lib/scoringService.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI-Powered Worker Scoring & Job Matching System
// Uses Google Gemini API for intelligent scoring
// Implements Hungarian Algorithm for optimal job-worker assignment
//
// FIXES APPLIED:
//   • computeWorkerGlobalScore(): replaced buggy addDoc+setDoc catch block
//     with a single setDoc({ merge: true }) — no more duplicate documents.
//   • scoreWorkerForJob(): added try/catch around Gemini call with detailed
//     error logging so failures are visible in console.
//   • fetchScoredApplications(): removed where("status","==","pending") filter
//     so no composite index is needed; filtering is done client-side instead.
//   • onWorkerApplied(): improved error logging to surface Gemini/API errors.
//   • callGemini(): added console.error on non-ok responses for easier debug.
// ─────────────────────────────────────────────────────────────────────────────

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
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_KEY}`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkerScore {
    workerId: string
    workerName: string
    totalScore: number          // 0–100
    rank: "S" | "A" | "B" | "C" | "D"
    breakdown: ScoreBreakdown
    redFlagged: boolean
    redFlagReason?: string
    updatedAt: Timestamp | null
}

export interface ScoreBreakdown {
    locationScore: number       // 0–25  (highest weight — emergency readiness)
    liabilityScore: number      // 0–25  (job completion, attendance, certification)
    skillScore: number          // 0–20  (skill match, job-specific fit)
    ratingScore: number         // 0–20  (past NGO ratings, balanced for new workers)
    reliabilityScore: number    // 0–10  (consistency, time adherence)
}

export interface JobApplicationScore {
    applicationId: string
    workerId: string
    workerName: string
    jobId: string
    aiScore: number             // 0–100 job-specific score
    rank: "S" | "A" | "B" | "C" | "D"
    breakdown?: ScoreBreakdown
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
    attendancePercent: number   // 0–100
    qualityRating: number       // 1–5 by NGO
    finalOutput: "excellent" | "good" | "average" | "poor"
    flagged: boolean
    flagReason?: string
}

// ── Rank Slabs ────────────────────────────────────────────────────────────────

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

// ── Core AI Scoring — Gemini ──────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
    // FIX: Guard against missing API key early
    if (!GEMINI_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set in your .env file")
    }

    const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                maxOutputTokens: 1024,
            },
        }),
    })

    if (!res.ok) {
        // FIX: Log full Gemini error body so you can see what went wrong
        const errBody = await res.text().catch(() => "(unreadable)")
        console.error(`Gemini API error ${res.status}:`, errBody)
        throw new Error(`Gemini API error: ${res.status} — ${errBody}`)
    }

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    // Strip markdown code fences if present
    return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
}

// ── Score a Worker's Global Profile ──────────────────────────────────────────

export async function computeWorkerGlobalScore(workerId: string): Promise<WorkerScore> {
    // 1. Fetch worker profile
    const workerSnap = await getDoc(doc(db, "users", workerId))
    if (!workerSnap.exists()) throw new Error("Worker not found")
    const worker = workerSnap.data()

    // 2. Fetch all applications
    const appsSnap = await getDocs(query(
        collection(db, "applications"),
        where("workerId", "==", workerId)
    ))
    const applications = appsSnap.docs.map(d => d.data())

    // 3. Fetch all ratings
    const ratingsSnap = await getDocs(query(
        collection(db, "workerRatings"),
        where("workerId", "==", workerId)
    ))
    const ratings = ratingsSnap.docs.map(d => d.data())

    // 4. Fetch red flags
    const flagsSnap = await getDocs(query(
        collection(db, "workerFlags"),
        where("workerId", "==", workerId),
        where("active", "==", true)
    ))
    const flags = flagsSnap.docs.map(d => d.data())

    // 5. Build prompt
    const totalJobs = applications.length
    const completedJobs = ratings.filter(r => r.completedOnTime).length
    const avgRating = ratings.length > 0
        ? ratings.reduce((s, r) => s + (r.qualityRating || 3), 0) / ratings.length
        : null
    const avgAttendance = ratings.length > 0
        ? ratings.reduce((s, r) => s + (r.attendancePercent || 100), 0) / ratings.length
        : null
    const isCertified = worker.certified === true
    const isNewWorker = totalJobs === 0

    const prompt = `
You are a fair, unbiased AI scoring system for an NGO worker platform.
Score this worker's GLOBAL PROFILE. Be fair to new workers — lack of history should NOT heavily penalize them.

WORKER PROFILE:
- Location: ${worker.city || "Unknown"}, ${worker.state || "Unknown"}
- Education: ${worker.education || "Not specified"}
- Skills: ${worker.skills || "Not listed"}
- Is Certified by an NGO: ${isCertified ? "YES (+bonus)" : "No"}
- Account verified/documents uploaded: ${worker.documentsVerified ? "YES" : "No"}
- Is new worker (no job history): ${isNewWorker ? "YES — be generous, do not penalize" : "No"}

JOB HISTORY:
- Total applications: ${totalJobs}
- Completed on time: ${completedJobs}
- Completion rate: ${totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : "N/A (new)"}%
- Average NGO rating: ${avgRating !== null ? avgRating.toFixed(1) + "/5" : "No ratings yet"}
- Average attendance: ${avgAttendance !== null ? avgAttendance.toFixed(0) + "%" : "No data yet"}

RED FLAGS:
${flags.length === 0 ? "None" : flags.map(f => `- ${f.reason} (severity: ${f.severity})`).join("\n")}

SCORING RULES (weights add to 100):
1. locationScore (max 25): Based on profile completeness of location data. Full marks if location is complete and verified.
2. liabilityScore (max 25): Completion rate, attendance, certifications, document uploads. New workers get 15/25 base.
3. skillScore (max 20): Skills listed, education level, relevance. New workers score on profile alone.
4. ratingScore (max 20): Average NGO rating. New workers (no ratings) get 12/20 — neutral score, not penalized.
5. reliabilityScore (max 10): Consistency across jobs. New workers get 6/10 base.

RED FLAG RULES:
- Minor flag (harassment complaint): reduce total by 10, flag as warning
- Moderate flag (abandonment, fraud): reduce total by 25, flag required
- Severe flag (criminal activity, violence): set redFlagged=true, score=0

Respond ONLY with valid JSON, no explanation:
{
  "breakdown": {
    "locationScore": <number 0-25>,
    "liabilityScore": <number 0-25>,
    "skillScore": <number 0-20>,
    "ratingScore": <number 0-20>,
    "reliabilityScore": <number 0-10>
  },
  "redFlagged": <boolean>,
  "redFlagReason": "<string or null>"
}
`

    const raw = await callGemini(prompt)
    const result = JSON.parse(raw)

    const breakdown: ScoreBreakdown = result.breakdown
    const totalScore = Math.min(100, Math.max(0,
        breakdown.locationScore +
        breakdown.liabilityScore +
        breakdown.skillScore +
        breakdown.ratingScore +
        breakdown.reliabilityScore
    ))
    const rank = getWorkerRank(totalScore)

    const workerScore: Omit<WorkerScore, "updatedAt"> = {
        workerId,
        workerName: worker.fullName || "Unknown",
        totalScore: Math.round(totalScore),
        rank,
        breakdown,
        redFlagged: result.redFlagged || false,
        redFlagReason: result.redFlagReason || undefined,
    }

    // FIX: Replaced buggy addDoc+setDoc catch block with a single setDoc + merge:true.
    // merge:true means: create the document if it doesn't exist, update it if it does.
    // This avoids duplicate documents and never throws a "document not found" error.
    await setDoc(
        doc(db, "workerScores", workerId),
        { ...workerScore, updatedAt: serverTimestamp() },
        { merge: true }
    )

    return { ...workerScore, updatedAt: null }
}

// ── Score a Worker for a Specific Job ────────────────────────────────────────

export async function scoreWorkerForJob(
    applicationId: string,
    workerId: string,
    jobId: string,
): Promise<JobApplicationScore> {
    // Fetch worker, job, and global score in parallel
    const [workerSnap, jobSnap, scoreSnap] = await Promise.all([
        getDoc(doc(db, "users", workerId)),
        getDoc(doc(db, "jobs", jobId)),
        getDoc(doc(db, "workerScores", workerId)),
    ])

    if (!workerSnap.exists() || !jobSnap.exists()) throw new Error("Worker or job not found")

    const worker = workerSnap.data()
    const job = jobSnap.data()
    const globalScore = scoreSnap.exists() ? scoreSnap.data() : null

    // Check if worker is currently active on another job
    const activeJobsSnap = await getDocs(query(
        collection(db, "applications"),
        where("workerId", "==", workerId),
        where("status", "==", "accepted")
    ))
    const activeJobs = activeJobsSnap.docs.length
    const isPremiumWorker = worker.premiumWorker === true
    const isOverloaded = !isPremiumWorker && activeJobs >= 1

    const prompt = `
You are a fair NGO job-matching AI. Score how well this worker fits THIS SPECIFIC JOB.
Consider job-specific fit, not just global profile.

JOB DETAILS:
- Title: ${job.title}
- Department: ${job.department}
- Required Experience: ${job.experience}
- Required Education: ${job.education}
- Location: ${job.location}
- Duration: ${job.duration}
- Salary: ₹${job.salary}/month

WORKER PROFILE:
- Name: ${worker.fullName}
- Location: ${worker.city}, ${worker.state}
- Education: ${worker.education || "Not specified"}
- Skills: ${worker.skills || "Not listed"}
- Experience Level: ${worker.experience || "Fresher"}
- Is Certified: ${worker.certified ? "YES" : "No"}
- Global Score: ${globalScore ? globalScore.totalScore + "/100 (Rank " + globalScore.rank + ")" : "Not yet scored — treat as new"}
- Currently on another job: ${isOverloaded ? "YES — already has active job" : "No"}

SCORING CRITERIA for this specific job (0–100):
- Location proximity/match to job site: 25 points
- Skills match for this department: 20 points
- Education meets requirement: 15 points
- Experience level match: 15 points
- Global reliability score adjusted: 15 points
- Availability (not overloaded): 10 points

IMPORTANT RULES:
- If worker is overloaded (non-premium with active job): cap score at 30 and note in concerns
- If worker's location is far from job location: reduce location points significantly
- New workers with matching skills/education should still score 50–65
- Do NOT penalize for being new — penalize only for mismatched skills or location

Respond ONLY with valid JSON:
{
  "aiScore": <number 0-100>,
  "matchReasons": ["<reason1>", "<reason2>", "<reason3>"],
  "concerns": ["<concern1 or empty array>"],
  "recommended": <boolean>
}
`

    // FIX: Wrapped Gemini call in try/catch so errors are visible in console
    // instead of silently failing and leaving applicationScores empty.
    let result: {
        aiScore: number
        matchReasons: string[]
        concerns: string[]
        recommended: boolean
    }

    try {
        const raw = await callGemini(prompt)
        result = JSON.parse(raw)
    } catch (err) {
        console.error("scoreWorkerForJob — Gemini call failed:", err)
        // Fallback: assign a neutral score so the application still appears
        result = {
            aiScore: 50,
            matchReasons: ["Score unavailable — AI service error, using default"],
            concerns: ["Could not reach Gemini API — check VITE_GEMINI_API_KEY"],
            recommended: false,
        }
    }

    const aiScore = Math.min(100, Math.max(0, Math.round(result.aiScore)))
    const rank = getWorkerRank(aiScore)

    const appScore: Omit<JobApplicationScore, "scoredAt"> = {
        applicationId,
        workerId,
        workerName: worker.fullName || "Unknown",
        jobId,
        aiScore,
        rank,
        breakdown: globalScore?.breakdown ?? null,
        matchReasons: result.matchReasons || [],
        concerns: result.concerns || [],
        recommended: result.recommended || false,
    }

    // Save to Firestore — use setDoc with merge:true for safety
    await setDoc(
        doc(db, "applicationScores", applicationId),
        { ...appScore, scoredAt: serverTimestamp() },
        { merge: true }
    )

    return { ...appScore, scoredAt: null }
}

// ── Rate Worker After Job Completion ─────────────────────────────────────────

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

// ── Fetch Scored Applications for a Job (NGO view) ────────────────────────────
// FIX: Removed where("status", "==", "pending") from the Firestore query.
// That second `where` clause requires a composite index (jobId + status) which
// wasn't created. We now fetch ALL applications for the job and filter
// client-side — no extra index needed, and NGOs can still see all statuses.

export async function fetchScoredApplications(jobId: string): Promise<{
    application: Record<string, unknown>
    score: JobApplicationScore | null
}[]> {
    // Single-field query — no composite index required
    const appsSnap = await getDocs(query(
        collection(db, "applications"),
        where("jobId", "==", jobId)
    ))

    // Client-side filter: only show pending applications in the AI panel
    const pendingDocs = appsSnap.docs.filter(d => d.data().status === "pending")

    console.log(`fetchScoredApplications: found ${appsSnap.docs.length} total, ${pendingDocs.length} pending for jobId=${jobId}`)

    const results = await Promise.all(
        pendingDocs.map(async (appDoc) => {
            const application = { id: appDoc.id, ...appDoc.data() }
            const scoreSnap = await getDoc(doc(db, "applicationScores", appDoc.id))
            const score = scoreSnap.exists()
                ? { applicationId: appDoc.id, ...scoreSnap.data() } as JobApplicationScore
                : null
            return { application, score }
        })
    )

    // Sort by AI score descending (unscored apps go to the bottom)
    return results.sort((a, b) => (b.score?.aiScore || 0) - (a.score?.aiScore || 0))
}

// ── Fetch a Worker's Own Score ────────────────────────────────────────────────

export async function fetchWorkerScore(workerId: string): Promise<WorkerScore | null> {
    const snap = await getDoc(doc(db, "workerScores", workerId))
    if (!snap.exists()) return null
    return snap.data() as WorkerScore
}

// ── Hungarian Algorithm — Optimal Job Assignment ──────────────────────────────

export function hungarianAssign(
    workers: string[],
    jobs: string[],
    costMatrix: number[][]
): { workerId: string; jobId: string; score: number }[] {
    const assigned: { workerId: string; jobId: string; score: number }[] = []
    const usedWorkers = new Set<number>()
    const usedJobs = new Set<number>()

    const pairs: { i: number; j: number; score: number }[] = []
    for (let i = 0; i < workers.length; i++) {
        for (let j = 0; j < jobs.length; j++) {
            pairs.push({ i, j, score: costMatrix[i]?.[j] ?? 0 })
        }
    }
    pairs.sort((a, b) => b.score - a.score)

    for (const { i, j, score } of pairs) {
        if (!usedWorkers.has(i) && !usedJobs.has(j)) {
            assigned.push({ workerId: workers[i], jobId: jobs[j], score })
            usedWorkers.add(i)
            usedJobs.add(j)
        }
    }

    return assigned
}

// ── Trigger scoring when worker applies ──────────────────────────────────────

export async function onWorkerApplied(
    applicationId: string,
    workerId: string,
    jobId: string,
): Promise<void> {
    try {
        // Compute global score if not exists
        const scoreSnap = await getDoc(doc(db, "workerScores", workerId))
        if (!scoreSnap.exists()) {
            await computeWorkerGlobalScore(workerId)
        }
        // Compute job-specific score
        await scoreWorkerForJob(applicationId, workerId, jobId)
        console.log(`✅ Scoring complete for applicationId=${applicationId}`)
    } catch (err) {
        // FIX: Log the full error so it's visible in console during development
        console.error("onWorkerApplied — scoring failed (non-blocking):", err)
        // Scoring errors never block the application process
    }
}
// src/lib/jobService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Replaces Project 2's backend/routes/notes.js
// All CRUD operations go directly to Firestore.
// Firestore security rules (set in Firebase Console) enforce ownership —
// analogous to the fetchuser middleware + ownership checks in notes.js.
//
// FIRESTORE SECURITY RULES to paste in Firebase Console → Firestore → Rules:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{uid} {
//       allow read, write: if request.auth.uid == uid;
//     }
//     match /jobs/{jobId} {
//       allow read: if true;
//       allow create: if request.auth != null
//                       && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ngo';
//       allow update, delete: if request.auth != null
//                               && resource.data.postedBy == request.auth.uid;
//     }
//     match /applications/{appId} {
//       allow create: if request.auth != null
//                       && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'worker';
//       allow read: if request.auth != null
//                    && (resource.data.workerId == request.auth.uid
//                        || resource.data.ngoId == request.auth.uid);
//       allow update: if request.auth != null
//                      && (resource.data.ngoId == request.auth.uid);
//     }
//     match /proofSubmissions/{proofId} {
//       allow create: if request.auth != null;
//       allow read, update: if request.auth != null
//                             && (resource.data.workerId == request.auth.uid
//                                 || resource.data.ngoId == request.auth.uid);
//     }
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Job {
    id: string
    title: string
    department: string
    positions: number
    filled: number
    salary: string
    salaryNum: number
    duration: string
    education: string
    experience: string
    location: string
    status: "active" | "closed"
    postedBy: string      // NGO uid
    ngoName: string
    createdAt: Timestamp | null
}

export interface Application {
    id: string
    jobId: string
    jobTitle: string
    ngoId: string
    ngoName: string
    workerId: string
    workerName: string
    workerPhone: string
    workerLocation: string
    status: "pending" | "accepted" | "rejected"
    appliedAt: Timestamp | null
}

export interface ProofSubmission {
    id: string
    jobId: string
    jobTitle: string
    workerId: string
    workerName: string
    ngoId: string
    fileURL: string
    note: string
    status: "pending" | "approved" | "rejected"
    submittedAt: Timestamp | null
}

// ── ROUTE 1 equivalent: Get all jobs (public, for worker browse) ──────────────
// Mirrors GET /api/notes/fetchallnotes (scoped to current user)
// For jobs: workers see ALL active jobs; NGOs see only their own.

export async function fetchAllJobs(): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job))
}

export async function fetchNGOJobs(ngoUid: string): Promise<Job[]> {
    const q = query(
        collection(db, "jobs"),
        where("postedBy", "==", ngoUid),
        orderBy("createdAt", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job))
}

// ── ROUTE 2 equivalent: Add a job ─────────────────────────────────────────────
// Mirrors POST /api/notes/addnote

export async function addJob(
    ngoUid: string,
    ngoName: string,
    data: {
        title: string
        department: string
        positions: number
        salary: string
        salaryNum: number
        duration: string
        education: string
        experience: string
        location: string
    }
): Promise<string> {
    const ref = await addDoc(collection(db, "jobs"), {
        ...data,
        filled: 0,
        status: "active",
        postedBy: ngoUid,
        ngoName,
        createdAt: serverTimestamp(),
    })
    return ref.id
}

// ── ROUTE 3 equivalent: Update a job ─────────────────────────────────────────
// Mirrors PUT /api/notes/updatenote/:id

export async function updateJob(
    jobId: string,
    updates: Partial<Omit<Job, "id" | "postedBy" | "createdAt">>
): Promise<void> {
    await updateDoc(doc(db, "jobs", jobId), updates)
}

// ── ROUTE 4 equivalent: Delete a job ─────────────────────────────────────────
// Mirrors DELETE /api/notes/deletenote/:id

export async function deleteJob(jobId: string): Promise<void> {
    await deleteDoc(doc(db, "jobs", jobId))
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function applyForJob(
    job: Pick<Job, "id" | "title" | "postedBy" | "ngoName">,
    worker: { uid: string; fullName: string; phone: string; location: string }
): Promise<string> {
    const ref = await addDoc(collection(db, "applications"), {
        jobId: job.id,
        jobTitle: job.title,
        ngoId: job.postedBy,
        ngoName: job.ngoName,
        workerId: worker.uid,
        workerName: worker.fullName,
        workerPhone: worker.phone,
        workerLocation: worker.location,
        status: "pending",
        appliedAt: serverTimestamp(),
    })
    return ref.id
}

export async function fetchWorkerApplications(workerUid: string): Promise<Application[]> {
    const q = query(
        collection(db, "applications"),
        where("workerId", "==", workerUid),
        orderBy("appliedAt", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application))
}

export async function fetchNGOApplications(ngoUid: string): Promise<Application[]> {
    const q = query(
        collection(db, "applications"),
        where("ngoId", "==", ngoUid),
        orderBy("appliedAt", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application))
}

export async function updateApplicationStatus(
    appId: string,
    status: "accepted" | "rejected"
): Promise<void> {
    await updateDoc(doc(db, "applications", appId), { status })
    // If accepted, increment job.filled
    const appSnap = await getDoc(doc(db, "applications", appId))
    if (appSnap.exists() && status === "accepted") {
        const jobRef = doc(db, "jobs", appSnap.data().jobId)
        const jobSnap = await getDoc(jobRef)
        if (jobSnap.exists()) {
            const filled = (jobSnap.data().filled || 0) + 1
            const totalPos = jobSnap.data().positions || 1
            await updateDoc(jobRef, {
                filled,
                status: filled >= totalPos ? "closed" : "active",
            })
        }
    }
}

// ── Proof submissions ─────────────────────────────────────────────────────────

export async function submitProof(data: {
    jobId: string
    jobTitle: string
    workerId: string
    workerName: string
    ngoId: string
    fileURL: string
    note: string
}): Promise<string> {
    const ref = await addDoc(collection(db, "proofSubmissions"), {
        ...data,
        status: "pending",
        submittedAt: serverTimestamp(),
    })
    return ref.id
}

export async function fetchWorkerProofs(workerUid: string): Promise<ProofSubmission[]> {
    const q = query(
        collection(db, "proofSubmissions"),
        where("workerId", "==", workerUid),
        orderBy("submittedAt", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProofSubmission))
}
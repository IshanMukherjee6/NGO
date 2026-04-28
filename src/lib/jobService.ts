// src/lib/jobService.ts
import {
    collection, addDoc, getDocs, getDoc, updateDoc,
    deleteDoc, doc, query, where, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import { onWorkerApplied } from "./scoringService"

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
    postedBy: string
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
    workerEmail: string
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

export async function fetchAllJobs(): Promise<Job[]> {
    const q = query(collection(db, "jobs"), where("status", "==", "active"))
    const snap = await getDocs(q)
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job))
    return jobs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
}

export async function fetchNGOJobs(ngoUid: string): Promise<Job[]> {
    const q = query(collection(db, "jobs"), where("postedBy", "==", ngoUid))
    const snap = await getDocs(q)
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job))
    return jobs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
}

export async function addJob(
    ngoUid: string, ngoName: string,
    data: { title: string; department: string; positions: number; salary: string; salaryNum: number; duration: string; education: string; experience: string; location: string }
): Promise<string> {
    const ref = await addDoc(collection(db, "jobs"), {
        ...data, filled: 0, status: "active", postedBy: ngoUid, ngoName, createdAt: serverTimestamp(),
    })
    return ref.id
}

export async function updateJob(jobId: string, updates: Partial<Omit<Job, "id" | "postedBy" | "createdAt">>): Promise<void> {
    await updateDoc(doc(db, "jobs", jobId), updates)
}

export async function deleteJob(jobId: string): Promise<void> {
    await deleteDoc(doc(db, "jobs", jobId))
}

export async function applyForJob(
    job: Pick<Job, "id" | "title" | "postedBy" | "ngoName">,
    worker: { uid: string; fullName: string; phone: string; email: string; location: string }
): Promise<string> {
    const ref = await addDoc(collection(db, "applications"), {
        jobId: job.id, jobTitle: job.title, ngoId: job.postedBy, ngoName: job.ngoName,
        workerId: worker.uid, workerName: worker.fullName, workerPhone: worker.phone,
        workerEmail: worker.email || "", workerLocation: worker.location,
        status: "pending", appliedAt: serverTimestamp(),
    })
    onWorkerApplied(ref.id, worker.uid, job.id)
    return ref.id
}

export async function fetchWorkerApplications(workerUid: string): Promise<Application[]> {
    const q = query(collection(db, "applications"), where("workerId", "==", workerUid))
    const snap = await getDocs(q)
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application))
    return apps.sort((a, b) => (b.appliedAt?.toMillis() ?? 0) - (a.appliedAt?.toMillis() ?? 0))
}

export async function fetchNGOApplications(ngoUid: string): Promise<Application[]> {
    const q = query(collection(db, "applications"), where("ngoId", "==", ngoUid))
    const snap = await getDocs(q)
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application))
    return apps.sort((a, b) => (b.appliedAt?.toMillis() ?? 0) - (a.appliedAt?.toMillis() ?? 0))
}

export async function updateApplicationStatus(appId: string, status: "accepted" | "rejected"): Promise<void> {
    const appRef = doc(db, "applications", appId)
    const appSnap = await getDoc(appRef)
    if (!appSnap.exists()) throw new Error("Application not found")
    await updateDoc(appRef, { status })
    if (status === "accepted") {
        const jobRef = doc(db, "jobs", appSnap.data().jobId)
        const jobSnap = await getDoc(jobRef)
        if (jobSnap.exists()) {
            const filled = (jobSnap.data().filled || 0) + 1
            const totalPos = jobSnap.data().positions || 1
            await updateDoc(jobRef, { filled, status: filled >= totalPos ? "closed" : "active" })
        }
    }
}

export async function submitProof(data: {
    jobId: string; jobTitle: string; workerId: string; workerName: string;
    ngoId: string; fileURL: string; note: string
}): Promise<string> {
    const ref = await addDoc(collection(db, "proofSubmissions"), { ...data, status: "pending", submittedAt: serverTimestamp() })
    return ref.id
}

export async function fetchWorkerProofs(workerUid: string): Promise<ProofSubmission[]> {
    const q = query(collection(db, "proofSubmissions"), where("workerId", "==", workerUid))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProofSubmission))
}
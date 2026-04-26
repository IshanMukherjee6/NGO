// src/lib/authService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Replaces Project 2's backend/routes/auth.js
// All auth operations now go directly to Firebase (no Express server needed).
// JWT token management is handled by Firebase ID tokens automatically.
//
// NOTE: When the Python backend is integrated later, call it AFTER Firebase
// auth succeeds — pass the Firebase ID token as a Bearer token in the
// Authorization header of your Python API requests.
// ─────────────────────────────────────────────────────────────────────────────

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type UserCredential,
} from "firebase/auth"
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore"
import { auth, db } from "./firebase"

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "ngo" | "worker"

export interface NGOProfile {
    uid: string
    role: "ngo"
    ngoName: string
    regNumber: string
    country: string
    state: string
    panNumber: string
    darpanId: string
    username: string
    email: string
    createdAt: unknown
}

export interface WorkerProfile {
    uid: string
    role: "worker"
    fullName: string
    age: string
    phone: string
    panNumber: string
    country: string
    state: string
    city: string
    district: string
    username: string
    email: string
    createdAt: unknown
}

export type UserProfile = NGOProfile | WorkerProfile

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Reads user profile document from Firestore */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid))
    if (!snap.exists()) return null
    return snap.data() as UserProfile
}

// ── ROUTE 1 equivalent: Register NGO ─────────────────────────────────────────
// Mirrors POST /api/auth/createuser (with NGO-specific fields)

export async function registerNGO(data: {
    ngoName: string
    regNumber: string
    country: string
    state: string
    panNumber: string
    darpanId: string
    username: string
    password: string
}): Promise<UserCredential> {
    // Firebase requires a real email; we synthesise one from username
    const email = `${data.username.toLowerCase().replace(/\s+/g, "")}@ngo.ngoconnect.app`

    const credential = await createUserWithEmailAndPassword(auth, email, data.password)
    const { user } = credential

    await updateProfile(user, { displayName: data.ngoName })

    // Store full profile in Firestore (mirrors MongoDB User document)
    const profile: NGOProfile = {
        uid: user.uid,
        role: "ngo",
        ngoName: data.ngoName,
        regNumber: data.regNumber,
        country: data.country,
        state: data.state,
        panNumber: data.panNumber,
        darpanId: data.darpanId,
        username: data.username,
        email,
        createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, "users", user.uid), profile)

    return credential
}

// ── ROUTE 1 equivalent: Register Worker ──────────────────────────────────────

export async function registerWorker(data: {
    fullName: string
    age: string
    phone: string
    panNumber: string
    country: string
    state: string
    city: string
    district: string
    username: string
    password: string
}): Promise<UserCredential> {
    const email = `${data.username.toLowerCase().replace(/\s+/g, "")}@worker.ngoconnect.app`

    const credential = await createUserWithEmailAndPassword(auth, email, data.password)
    const { user } = credential

    await updateProfile(user, { displayName: data.fullName })

    const profile: WorkerProfile = {
        uid: user.uid,
        role: "worker",
        fullName: data.fullName,
        age: data.age,
        phone: data.phone,
        panNumber: data.panNumber,
        country: data.country,
        state: data.state,
        city: data.city,
        district: data.district,
        username: data.username,
        email,
        createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, "users", user.uid), profile)

    return credential
}

// ── ROUTE 2 equivalent: Login ─────────────────────────────────────────────────
// Mirrors POST /api/auth/login

export async function loginUser(username: string, password: string): Promise<UserProfile> {
    // Attempt both NGO and worker email formats
    let credential: UserCredential | null = null

    const ngoEmail = `${username.toLowerCase().replace(/\s+/g, "")}@ngo.ngoconnect.app`
    const workerEmail = `${username.toLowerCase().replace(/\s+/g, "")}@worker.ngoconnect.app`

    try {
        credential = await signInWithEmailAndPassword(auth, ngoEmail, password)
    } catch {
        // Not an NGO — try worker
        credential = await signInWithEmailAndPassword(auth, workerEmail, password)
    }

    const profile = await getUserProfile(credential.user.uid)
    if (!profile) throw new Error("User profile not found.")
    return profile
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
    await signOut(auth)
}
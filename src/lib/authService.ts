// src/lib/authService.ts

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

export type UserRole = "ngo" | "worker"

/* -------------------------------------------------------------------------- */
/*                               NGO PROFILE TYPE                             */
/* -------------------------------------------------------------------------- */

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
    ngoEmail: string
    isPremium: boolean
    createdAt: unknown
}

/* -------------------------------------------------------------------------- */
/*                        WORKER QUALIFICATION ENUMS                           */
/* -------------------------------------------------------------------------- */

export type EducationLevel =
    | "8th Pass"
    | "10th Pass"
    | "12th Pass"
    | "Graduate"
    | "Post Graduate"

export type ExperienceLevel =
    | "Fresher"
    | "0-1 years"
    | "1-2 years"
    | "2-3 years"
    | "3-5 years"
    | "5+ years"

export const EDUCATION_OPTIONS: EducationLevel[] = [
    "8th Pass",
    "10th Pass",
    "12th Pass",
    "Graduate",
    "Post Graduate",
]

export const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
    "Fresher",
    "0-1 years",
    "1-2 years",
    "2-3 years",
    "3-5 years",
    "5+ years",
]

/* -------------------------------------------------------------------------- */
/*                             WORKER PROFILE TYPE                            */
/* -------------------------------------------------------------------------- */

export interface WorkerProfile {
    uid: string
    role: "worker"
    fullName: string
    age: string
    phone: string
    email: string
    panNumber: string
    country: string
    state: string
    city: string
    district: string
    username: string
    firebaseEmail: string

    // Qualification Fields
    education?: EducationLevel
    experience?: ExperienceLevel
    skills?: string[]

    // Lifecycle / Ranking Flags
    certified?: boolean
    documentsVerified?: boolean
    premiumWorker?: boolean

    createdAt: unknown
}

export type UserProfile = NGOProfile | WorkerProfile

/* -------------------------------------------------------------------------- */
/*                          DARPAN ID VALIDATION                              */
/* -------------------------------------------------------------------------- */

const DARPAN_REGEX = /^[A-Z]{2}\/\d{4}\/\d{7}$/

export function validateDarpanId(
    id: string
): { valid: boolean; message: string } {
    const trimmed = id.trim().toUpperCase()

    if (!trimmed) {
        return {
            valid: false,
            message: "DARPAN ID is required.",
        }
    }

    if (!DARPAN_REGEX.test(trimmed)) {
        return {
            valid: false,
            message:
                "Invalid DARPAN ID. Expected format: GJ/2021/0123456 (state/year/7 digits).",
        }
    }

    const year = parseInt(trimmed.split("/")[1])

    if (
        year < 2000 ||
        year > new Date().getFullYear()
    ) {
        return {
            valid: false,
            message: `Year in DARPAN ID must be between 2000 and ${new Date().getFullYear()}.`,
        }
    }

    return {
        valid: true,
        message: "Valid DARPAN ID format.",
    }
}

/* -------------------------------------------------------------------------- */
/*                           GET USER PROFILE                                 */
/* -------------------------------------------------------------------------- */

export async function getUserProfile(
    uid: string
): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid))

    if (!snap.exists()) return null

    return snap.data() as UserProfile
}

/* -------------------------------------------------------------------------- */
/*                             REGISTER NGO                                   */
/* -------------------------------------------------------------------------- */

export async function registerNGO(data: {
    ngoName: string
    regNumber: string
    country: string
    state: string
    panNumber: string
    darpanId: string
    username: string
    password: string
    ngoEmail: string
}): Promise<UserCredential> {
    const email =
        `${data.username.toLowerCase().replace(/\s+/g, "")}` +
        "@ngo.ngoconnect.app"

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            data.password
        )

    const { user } = credential

    await updateProfile(user, {
        displayName: data.ngoName,
    })

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
        ngoEmail: data.ngoEmail,
        isPremium: false,
        createdAt: serverTimestamp(),
    }

    await setDoc(doc(db, "users", user.uid), profile)

    return credential
}

/* -------------------------------------------------------------------------- */
/*                           REGISTER WORKER                                  */
/* -------------------------------------------------------------------------- */

export async function registerWorker(data: {
    fullName: string
    age: string
    phone: string
    email: string
    panNumber: string
    country: string
    state: string
    city: string
    district: string
    username: string
    password: string

    education: EducationLevel
    experience: ExperienceLevel
    skills: string[]
}): Promise<UserCredential> {
    const firebaseEmail =
        `${data.username.toLowerCase().replace(/\s+/g, "")}` +
        "@worker.ngoconnect.app"

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            firebaseEmail,
            data.password
        )

    const { user } = credential

    await updateProfile(user, {
        displayName: data.fullName,
    })

    const profile: WorkerProfile = {
        uid: user.uid,
        role: "worker",
        fullName: data.fullName,
        age: data.age,
        phone: data.phone,
        email: data.email,
        panNumber: data.panNumber,
        country: data.country,
        state: data.state,
        city: data.city,
        district: data.district,
        username: data.username,
        firebaseEmail,

        education: data.education,
        experience: data.experience,
        skills: data.skills,

        certified: false,
        documentsVerified: false,
        premiumWorker: false,

        createdAt: serverTimestamp(),
    }

    await setDoc(doc(db, "users", user.uid), profile)

    return credential
}

/* -------------------------------------------------------------------------- */
/*                               LOGIN USER                                   */
/* -------------------------------------------------------------------------- */

export async function loginUser(
    username: string,
    password: string
): Promise<UserProfile> {
    let credential: UserCredential | null = null

    const cleanedUsername =
        username.toLowerCase().replace(/\s+/g, "")

    const ngoEmail =
        `${cleanedUsername}@ngo.ngoconnect.app`

    const workerEmail =
        `${cleanedUsername}@worker.ngoconnect.app`

    try {
        credential =
            await signInWithEmailAndPassword(
                auth,
                ngoEmail,
                password
            )
    } catch {
        credential =
            await signInWithEmailAndPassword(
                auth,
                workerEmail,
                password
            )
    }

    const profile = await getUserProfile(
        credential.user.uid
    )

    if (!profile) {
        throw new Error("User profile not found.")
    }

    return profile
}

/* -------------------------------------------------------------------------- */
/*                               LOGOUT USER                                  */
/* -------------------------------------------------------------------------- */

export async function logoutUser(): Promise<void> {
    await signOut(auth)
}
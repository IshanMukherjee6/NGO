// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Global auth state — mirrors the NoteContext / NoteState pattern from
// Project 2, but uses Firebase instead of JWT + localStorage.
//
// Provides: currentUser (Firebase User), userProfile (Firestore doc),
// loading state, login/logout/register helpers.
//
// NOTE for Python backend integration:
//   When calling your Python API, do:
//     const token = await currentUser.getIdToken()
//     fetch("https://your-python-api.com/endpoint", {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//   Verify the Firebase ID token on the Python side using firebase-admin.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "../lib/firebase"
import {
    getUserProfile,
    loginUser,
    logoutUser,
    registerNGO,
    registerWorker,
    type UserProfile,
} from "../lib/authService"

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
    currentUser: User | null
    userProfile: UserProfile | null
    authLoading: boolean

    login: (username: string, password: string) => Promise<UserProfile>
    logout: () => Promise<void>
    signUpNGO: (data: Parameters<typeof registerNGO>[0]) => Promise<void>
    signUpWorker: (data: Parameters<typeof registerWorker>[0]) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    // Mirror of Project 2's token-check on mount — Firebase handles this
    // automatically via onAuthStateChanged (replaces localStorage token reads)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid)
                    setUserProfile(profile)
                } catch {
                    setUserProfile(null)
                }
            } else {
                setUserProfile(null)
            }
            setAuthLoading(false)
        })
        return unsubscribe
    }, [])

    const login = async (username: string, password: string): Promise<UserProfile> => {
        const profile = await loginUser(username, password)
        setUserProfile(profile)
        return profile
    }

    const logout = async () => {
        await logoutUser()
        setCurrentUser(null)
        setUserProfile(null)
    }

    const signUpNGO = async (data: Parameters<typeof registerNGO>[0]) => {
        await registerNGO(data)
        const profile = await getUserProfile(auth.currentUser!.uid)
        setUserProfile(profile)
    }

    const signUpWorker = async (data: Parameters<typeof registerWorker>[0]) => {
        await registerWorker(data)
        const profile = await getUserProfile(auth.currentUser!.uid)
        setUserProfile(profile)
    }

    return (
        <AuthContext.Provider
            value={{ currentUser, userProfile, authLoading, login, logout, signUpNGO, signUpWorker }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
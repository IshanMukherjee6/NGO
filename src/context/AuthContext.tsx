// src/context/AuthContext.tsx
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

// NGO sub-role stored in memory (not Firestore) — just controls which UI to show
export type NGOSubRole = "official" | "surveyor" | null

interface AuthContextValue {
    currentUser: User | null
    userProfile: UserProfile | null
    authLoading: boolean
    ngoSubRole: NGOSubRole
    setNGOSubRole: (role: NGOSubRole) => void

    login: (username: string, password: string) => Promise<UserProfile>
    logout: () => Promise<void>
    signUpNGO: (data: Parameters<typeof registerNGO>[0]) => Promise<void>
    signUpWorker: (data: Parameters<typeof registerWorker>[0]) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [ngoSubRole, setNGOSubRole] = useState<NGOSubRole>(null)

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
                setNGOSubRole(null)
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
        setNGOSubRole(null)
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
            value={{ currentUser, userProfile, authLoading, ngoSubRole, setNGOSubRole, login, logout, signUpNGO, signUpWorker }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
// src/components/ProtectedRoute.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Guards routes that require authentication.
// Replaces the token-check logic scattered across Project 2's components.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { UserRole } from "../lib/authService"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { currentUser, userProfile, authLoading } = useAuth()

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole && userProfile?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
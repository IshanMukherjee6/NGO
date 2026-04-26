// src/pages/Register.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Visually unchanged from Project 1. No backend changes needed here —
// this is just a routing page that directs to /register/ngo or /register/worker.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from "react-router-dom"
import { Building2, HardHat, ChevronRight } from "lucide-react"

export default function Register() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-24 pb-12">
            <div className="w-full max-w-md">

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
                    <p className="text-muted-foreground mt-2 text-base">
                        Choose how you'd like to join NGO Connect
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate("/register/ngo")}
                        className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-foreground bg-card hover:bg-muted/40 transition-all group text-left w-full"
                    >
                        <div className="w-13 h-13 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors p-3">
                            <Building2 size={26} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">Register as an NGO</p>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                Upload data, post jobs, and manage field workers across locations.
                            </p>
                        </div>
                        <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>

                    <button
                        onClick={() => navigate("/register/worker")}
                        className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-foreground bg-card hover:bg-muted/40 transition-all group text-left w-full"
                    >
                        <div className="w-13 h-13 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors p-3">
                            <HardHat size={26} className="text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">Register as a Worker</p>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                Get assigned to NGO jobs based on your location and availability.
                            </p>
                        </div>
                        <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    Already have an account?{" "}
                    <button onClick={() => navigate("/login")} className="text-foreground font-semibold hover:underline">
                        Log in
                    </button>
                </p>
            </div>
        </div>
    )
}
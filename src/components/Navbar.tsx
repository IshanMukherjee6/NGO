// src/components/Navbar.tsx

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const { currentUser, userProfile, logout } = useAuth()
    const { showToast } = useToast()

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Jobs", path: "/jobs" },
        { name: "About", path: "/about" },
    ]

    const handleLogout = async () => {
        try {
            await logout()
            showToast("Logged out successfully", "success")
            navigate("/")
        } catch {
            showToast("Failed to log out", "error")
        }
    }

    const displayName =
        userProfile?.role === "ngo"
            ? userProfile.ngoName
            : userProfile?.role === "worker"
                ? userProfile.fullName
                : null

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-14 py-5 flex items-center justify-between bg-black/30 backdrop-blur-md border-b border-white/10">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group select-none">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                    <img
                        src="/logo.jpeg"
                        alt="NGO Connect"
                        className="w-full h-full object-cover"
                    />
                </div>
                <span className="text-white font-bold text-[20px] tracking-tight">
                    NGO <span className="text-white/55 font-medium">Connect</span>
                </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                    <Link key={item.name} to={item.path}>
                        <Button variant="ghost" className="text-white/75 hover:text-white hover:bg-white/10 text-base font-medium px-5 h-10">
                            {item.name}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
                {currentUser && displayName ? (
                    <>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="text-white/75 hover:text-white text-sm font-medium px-3 transition-colors"
                        >
                            {displayName}
                        </button>
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="text-white/75 hover:text-white hover:bg-white/10 text-base font-medium px-4 h-10 gap-2"
                        >
                            <LogOut size={15} /> Log out
                        </Button>
                        <Button
                            onClick={() => navigate("/dashboard")}
                            className="rounded-full px-6 h-10 bg-white text-black hover:bg-white/90 font-semibold text-base shadow-sm"
                        >
                            Dashboard
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" onClick={() => navigate("/login")} className="text-white/75 hover:text-white hover:bg-white/10 text-base font-medium px-5 h-10">
                            Log in
                        </Button>
                        <Button
                            onClick={() => navigate("/register")}
                            className="rounded-full px-6 h-10 bg-white text-black hover:bg-white/90 font-semibold text-base shadow-sm"
                        >
                            Register
                        </Button>
                    </>
                )}
            </div>

            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setOpen(!open)}>
                {open ? <X size={22} /> : <Menu size={22} />}
            </Button>

            {/* Mobile menu */}
            {open && (
                <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-6 flex flex-col gap-2 md:hidden">
                    {navItems.map((item) => (
                        <Link key={item.name} to={item.path} onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 text-base font-medium">
                                {item.name}
                            </Button>
                        </Link>
                    ))}
                    <div className="flex gap-2 pt-3 border-t border-white/10 mt-1">
                        {currentUser ? (
                            <Button
                                onClick={() => { setOpen(false); handleLogout() }}
                                variant="outline"
                                className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-full gap-2"
                            >
                                <LogOut size={14} /> Log out
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => { setOpen(false); navigate("/login") }}
                                    variant="outline"
                                    className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-full"
                                >
                                    Log in
                                </Button>
                                <Button
                                    onClick={() => { setOpen(false); navigate("/register") }}
                                    className="flex-1 bg-white text-black hover:bg-white/90 rounded-full font-semibold"
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
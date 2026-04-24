import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function Navbar() {
    const [open, setOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-14 py-3.5 flex items-center justify-between bg-black/30 backdrop-blur-md border-b border-white/10">

            {/* ── Logo ── */}
            <a href="/" className="flex items-center gap-2.5 group select-none">
                {/* Icon mark */}
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9" cy="6.5" r="3" fill="#111827" />
                        <path d="M2.5 15.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </div>
                {/* Brand text */}
                <span className="text-white font-bold text-[15px] tracking-tight">
                    NGO <span className="text-white/55 font-medium">Connect</span>
                </span>
            </a>

            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center gap-1">
                {["Home", "Jobs", "Training"].map((item) => (
                    <Button
                        key={item}
                        variant="ghost"
                        size="sm"
                        className="text-white/75 hover:text-white hover:bg-white/10 font-medium text-sm px-4"
                    >
                        {item}
                    </Button>
                ))}
            </div>

            {/* ── Desktop actions ── */}
            <div className="hidden md:flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/75 hover:text-white hover:bg-white/10 font-medium px-4"
                >
                    Log in
                </Button>
                <Button
                    size="sm"
                    className="rounded-full px-5 bg-white text-black hover:bg-white/90 font-semibold shadow-sm"
                >
                    Register
                </Button>
            </div>

            {/* ── Mobile hamburger ── */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
            >
                {open ? <X size={20} /> : <Menu size={20} />}
            </Button>

            {/* ── Mobile menu ── */}
            {open && (
                <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-6 flex flex-col gap-2 md:hidden">
                    {["Home", "Jobs", "Training"].map((item) => (
                        <Button
                            key={item}
                            variant="ghost"
                            className="text-white/80 hover:text-white hover:bg-white/10 justify-start font-medium w-full"
                        >
                            {item}
                        </Button>
                    ))}
                    <div className="flex gap-2 pt-3 border-t border-white/10 mt-1">
                        <Button variant="outline" className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-full">
                            Log in
                        </Button>
                        <Button className="flex-1 bg-white text-black hover:bg-white/90 rounded-full font-semibold">
                            Register
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    )
}

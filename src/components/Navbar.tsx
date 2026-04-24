import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Link } from "react-router-dom"

export default function Navbar() {
    const [open, setOpen] = useState(false)

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Jobs", path: "/jobs" },
        { name: "About", path: "/about" },
        { name: "Training", path: "/training" },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-14 py-3.5 flex items-center justify-between bg-black/30 backdrop-blur-md border-b border-white/10">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group select-none">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <circle cx="9" cy="6.5" r="3" fill="#111827" />
                        <path d="M2.5 15.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="#111827" strokeWidth="1.8" />
                    </svg>
                </div>
                <span className="text-white font-bold text-[15px]">
                    NGO <span className="text-white/55">Connect</span>
                </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                    <Link key={item.name} to={item.path}>
                        <Button variant="ghost" size="sm" className="text-white/75 hover:text-white">
                            {item.name}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white/75">
                    Log in
                </Button>
                <Button size="sm" className="bg-white text-black">
                    Register
                </Button>
            </div>

            {/* Mobile button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white"
                onClick={() => setOpen(!open)}
            >
                {open ? <X size={20} /> : <Menu size={20} />}
            </Button>

            {/* Mobile menu */}
            {open && (
                <div className="absolute top-full left-0 right-0 bg-black/90 px-6 py-6 flex flex-col gap-2 md:hidden">
                    {navItems.map((item) => (
                        <Link key={item.name} to={item.path} onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full text-left text-white/80">
                                {item.name}
                            </Button>
                        </Link>
                    ))}

                    <div className="flex gap-2 pt-3 border-t border-white/10">
                        <Button variant="outline" className="flex-1 text-white">
                            Log in
                        </Button>
                        <Button className="flex-1 bg-white text-black">
                            Register
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    )
}
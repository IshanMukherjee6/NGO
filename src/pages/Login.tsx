// src/pages/Login.tsx
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff, Building2, ClipboardList } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"

function Field({ label, name, type = "text", value, onChange, placeholder, required = true }: {
    label: string; name: string; type?: string; value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string; required?: boolean
}) {
    const [show, setShow] = useState(false)
    const isPassword = type === "password"
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-sm font-medium text-foreground">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input id={name} name={name}
                    type={isPassword ? (show ? "text" : "password") : type}
                    value={value} onChange={onChange} placeholder={placeholder} required={required}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    style={{ paddingRight: isPassword ? "2.5rem" : undefined }} />
                {isPassword && (
                    <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    )
}

// ── NGO Sub-role selector shown after NGO login ───────────────────────────────
function NGOSubRoleSelector({ onSelect }: { onSelect: (role: "official" | "surveyor") => void }) {
    const [uniqueId, setUniqueId] = useState("")
    const [selectedRole, setSelectedRole] = useState<"official" | "surveyor" | null>(null)
    const [error, setError] = useState("")
    const { showToast } = useToast()

    const handleProceed = () => {
        if (!selectedRole) { setError("Please select a role."); return }
        if (uniqueId.length < 8) { setError("Unique ID must be at least 8 characters."); return }
        setError("")
        showToast(`Logged in as NGO ${selectedRole === "official" ? "Official" : "Surveyor"}`, "success")
        onSelect(selectedRole)
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Select Your Role</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Choose your NGO role and enter your unique access ID to continue.
                    </p>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={() => { setSelectedRole("official"); setError("") }}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${selectedRole === "official" ? "border-foreground bg-muted/40" : "border-border hover:border-muted-foreground bg-card"}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Building2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">NGO Official</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Manage jobs, view applicants, run AI analysis</p>
                        </div>
                        {selectedRole === "official" && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-background" />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => { setSelectedRole("surveyor"); setError("") }}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${selectedRole === "surveyor" ? "border-foreground bg-muted/40" : "border-border hover:border-muted-foreground bg-card"}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                            <ClipboardList size={20} className="text-violet-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">NGO Surveyor</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Upload field survey photos, enter survey rooms</p>
                        </div>
                        {selectedRole === "surveyor" && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-background" />
                            </div>
                        )}
                    </button>
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-sm font-medium text-foreground">
                        Unique Access ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={uniqueId}
                        onChange={e => { setUniqueId(e.target.value); setError("") }}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Enter the unique ID provided by your NGO administrator.</p>
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-2.5 mb-4">
                        {error}
                    </p>
                )}

                <Button onClick={handleProceed} className="w-full rounded-full h-11 font-semibold">
                    Continue →
                </Button>
            </div>
        </div>
    )
}

export default function Login() {
    const navigate = useNavigate()
    const { login, setNGOSubRole } = useAuth()
    const { showToast } = useToast()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ username: "", password: "" })
    // After NGO login, show sub-role selector
    const [awaitingNGOSubRole, setAwaitingNGOSubRole] = useState(false)

    const set = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!form.username || !form.password) { setError("Please enter your username and password."); return }
        setLoading(true)
        try {
            const profile = await login(form.username, form.password)
            if (profile.role === "ngo") {
                // NGO users must select a sub-role before proceeding
                setAwaitingNGOSubRole(true)
            } else {
                showToast("Logged in successfully!", "success")
                navigate("/dashboard")
            }
        } catch {
            setError("Invalid username or password. Please try again.")
            showToast("Login failed", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleSubRoleSelect = (role: "official" | "surveyor") => {
        setNGOSubRole(role)
        if (role === "surveyor") {
            navigate("/survey-room")
        } else {
            navigate("/dashboard")
        }
    }

    if (awaitingNGOSubRole) {
        return <NGOSubRoleSelector onSelect={handleSubRoleSelect} />
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group select-none">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                            src="/logo.jpeg"
                            alt="NGO Connect Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="font-bold text-[18px] tracking-tight text-foreground">
                        NGO <span className="text-muted-foreground font-medium">Connect</span>
                    </span>
                </Link>
                <div className="mb-7 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                    <p className="text-muted-foreground text-sm mt-1">Log in to your account to continue</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Field label="Username" name="username" value={form.username} onChange={set} placeholder="Enter your username" />
                    <Field label="Password" name="password" type="password" value={form.password} onChange={set} placeholder="Enter your password" />
                    <div className="flex justify-end -mt-1">
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Forgot password?</button>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-2.5">{error}</p>
                    )}
                    <Button type="submit" disabled={loading} className="rounded-full h-11 font-semibold mt-1">
                        {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Logging in...</> : "Log In"}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-foreground font-semibold hover:underline">Register</Link>
                </p>
            </div>
        </div>
    )
}
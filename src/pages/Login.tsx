import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"

function Field({
    label, name, type = "text", value, onChange, placeholder, required = true,
}: {
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
                <input
                    id={name} name={name}
                    type={isPassword ? (show ? "text" : "password") : type}
                    value={value} onChange={onChange} placeholder={placeholder} required={required}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    style={{ paddingRight: isPassword ? "2.5rem" : undefined }}
                />
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

export default function Login() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [form, setForm] = useState({
        username: "", password: ""
    })

    const set = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        // TODO: replace with real API call
        // const res = await fetch("/api/login", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(form)
        // })
        // const data = await res.json()
        // if (res.ok) {
        //   localStorage.setItem("token", data.token)
        //   navigate(data.role === "ngo" ? "/dashboard/ngo" : "/dashboard/worker")
        // } else {
        //   setError(data.message)
        // }

        setTimeout(() => {
            setLoading(false)
            // Simulating wrong credentials for demo
            if (form.username === "" || form.password === "") {
                setError("Please enter your username and password.")
                return
            }
            // Temporary: navigate to NGO dashboard
            // Backend will determine the correct redirect based on user role
            navigate("/dashboard")
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group select-none">
                    <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6.5" r="3" fill="#111827" />
                            <path d="M2.5 15.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="font-bold text-[18px] tracking-tight text-foreground">
                        NGO <span className="text-muted-foreground font-medium">Connect</span>
                    </span>
                </Link>

                {/* Heading */}
                <div className="mb-7 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                    <p className="text-muted-foreground text-sm mt-1">Log in to your account to continue</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Field label="Username" name="username" value={form.username} onChange={set}
                        placeholder="Enter your username" />
                    <Field label="Password" name="password" type="password" value={form.password} onChange={set}
                        placeholder="Enter your password" />

                    {/* Forgot password */}
                    <div className="flex justify-end -mt-1">
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                            {error}
                        </p>
                    )}

                    <Button type="submit" disabled={loading} className="rounded-full h-11 font-semibold mt-1">
                        {loading
                            ? <><Loader2 size={16} className="animate-spin mr-2" /> Logging in...</>
                            : "Log In"}
                    </Button>
                </form>

                {/* Register link */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-foreground font-semibold hover:underline">
                        Register
                    </Link>
                </p>

            </div>
        </div>
    )
}

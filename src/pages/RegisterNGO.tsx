// src/pages/RegisterNGO.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ChevronRight, Check, Loader2, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { validateDarpanId } from "../lib/authService"

function Field({
    label, name, type = "text", value, onChange, placeholder, required = true, error,
}: {
    label: string; name: string; type?: string; value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string; required?: boolean; error?: string
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
                    className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-400" : "border-border"} bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all`}
                    style={{ paddingRight: isPassword ? "2.5rem" : undefined }}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        </div>
    )
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {steps.map((label, i) => {
                const stepNum = i + 1
                const done = current > stepNum
                const active = current === stepNum
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done || active ? "bg-foreground text-background" : "bg-muted text-muted-foreground border border-border"}`}>
                            {done ? <Check size={13} /> : stepNum}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                        {i < steps.length - 1 && (
                            <div className={`w-8 h-px mx-1 ${done ? "bg-foreground" : "bg-border"}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

const INDIAN_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
    "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
    "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
    "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
    "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
]

export default function RegisterNGO() {
    const navigate = useNavigate()
    const { signUpNGO } = useAuth()
    const { showToast } = useToast()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [darpanValidation, setDarpanValidation] = useState<{ valid: boolean; message: string } | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const [form, setForm] = useState({
        ngoName: "", regNumber: "", country: "India", state: "",
        panNumber: "", darpanId: "",
        ngoEmail: "",
        username: "", password: "", confirmPassword: "",
    })

    const set = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (name === "darpanId") {
            const result = validateDarpanId(value)
            setDarpanValidation(result)
        }
        if (fieldErrors[name]) {
            setFieldErrors(prev => { const e = { ...prev }; delete e[name]; return e })
        }
    }

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault()
        const errors: Record<string, string> = {}
        if (!form.state) errors.state = "Please select a state."
        if (!form.ngoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ngoEmail)) {
            errors.ngoEmail = "Please enter a valid email address."
        }
        const darpan = validateDarpanId(form.darpanId)
        if (!darpan.valid) errors.darpanId = darpan.message
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            showToast("Please fix the highlighted errors.", "error")
            return
        }
        setStep(2)
    }

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors: Record<string, string> = {}
        if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match."
        if (form.password.length < 8) errors.password = "Password must be at least 8 characters."
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }
        setLoading(true)
        try {
            await signUpNGO({
                ngoName: form.ngoName,
                regNumber: form.regNumber,
                country: form.country,
                state: form.state,
                panNumber: form.panNumber,
                darpanId: form.darpanId.trim().toUpperCase(),
                username: form.username,
                password: form.password,
                ngoEmail: form.ngoEmail,
            })
            showToast("NGO registered successfully!", "success")
            setStep(3)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Registration failed"
            if (msg.includes("already-in-use")) {
                showToast("This username is already taken. Please choose another.", "error")
            } else {
                showToast(msg, "error")
            }
        } finally {
            setLoading(false)
        }
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-24 pb-12">
                <div className="w-full max-w-md text-center flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                        <Check size={32} className="text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">NGO Registered!</h2>
                        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto leading-relaxed">
                            <span className="font-semibold text-foreground">{form.ngoName}</span> has been successfully registered.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Button variant="outline" className="rounded-full px-6" onClick={() => navigate("/")}>Go Home</Button>
                        <Button className="rounded-full px-6" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background px-4 pt-28 pb-16 flex justify-center">
            <div className="w-full max-w-lg">
                <button onClick={() => step === 1 ? navigate("/register") : setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={15} />
                    {step === 1 ? "Back to register" : "Back to NGO details"}
                </button>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Register your NGO</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {step === 1 ? "Tell us about your organisation." : "Set up your login credentials."}
                    </p>
                </div>
                <StepIndicator current={step} steps={["NGO Details", "Account Setup"]} />

                {step === 1 && (
                    <form onSubmit={handleStep1} className="flex flex-col gap-5">
                        <Field label="NGO Name" name="ngoName" value={form.ngoName} onChange={set} placeholder="e.g. Help India Foundation" />
                        <Field label="Registration Number" name="regNumber" value={form.regNumber} onChange={set} placeholder="e.g. MH/2023/0123456" />
                        <Field label="Contact Email" name="ngoEmail" type="email" value={form.ngoEmail} onChange={set}
                            placeholder="e.g. contact@helpindia.org" error={fieldErrors.ngoEmail} />

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Country" name="country" value={form.country} onChange={set} placeholder="India" />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">State <span className="text-red-500">*</span></label>
                                <Select value={form.state} onValueChange={v => { setForm(prev => ({ ...prev, state: v })); setFieldErrors(prev => { const e = { ...prev }; delete e.state; return e }) }}>
                                    <SelectTrigger className={`rounded-xl border-border bg-muted/30 text-sm h-[42px] focus:ring-ring ${fieldErrors.state ? "border-red-400" : ""}`}>
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[9999] rounded-xl border-border bg-popover text-popover-foreground max-h-60">
                                        {INDIAN_STATES.map(s => (
                                            <SelectItem key={s} value={s} className="rounded-lg text-sm cursor-pointer">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.state && <p className="text-xs text-red-500">{fieldErrors.state}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="PAN Number" name="panNumber" value={form.panNumber} onChange={set} placeholder="ABCDE1234F" />
                            <div className="flex flex-col gap-1.5">
                                <Field label="DARPAN ID" name="darpanId" value={form.darpanId} onChange={set}
                                    placeholder="GJ/2021/0123456" error={fieldErrors.darpanId} />
                                {darpanValidation && form.darpanId && (
                                    <p className={`text-xs flex items-center gap-1 ${darpanValidation.valid ? "text-green-500" : "text-red-500"}`}>
                                        {darpanValidation.valid
                                            ? <><CheckCircle2 size={11} />Valid DARPAN ID format</>
                                            : <><AlertCircle size={11} />{darpanValidation.message}</>}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">Format: XX/YYYY/NNNNNNN (e.g. GJ/2021/0123456)</p>
                            </div>
                        </div>

                        <Button type="submit" className="rounded-full h-11 font-semibold mt-2">
                            Continue <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleStep2} className="flex flex-col gap-5">
                        <Field label="Username" name="username" value={form.username} onChange={set} placeholder="Choose a unique username" />
                        <Field label="Password" name="password" type="password" value={form.password} onChange={set}
                            placeholder="Minimum 8 characters" error={fieldErrors.password} />
                        <Field label="Confirm Password" name="confirmPassword" type="password"
                            value={form.confirmPassword} onChange={set} placeholder="Re-enter your password" error={fieldErrors.confirmPassword} />
                        <p className="text-xs text-muted-foreground -mt-2 leading-relaxed">
                            Your account will be cross-verified against NGO registration records before activation.
                        </p>
                        <Button type="submit" disabled={loading} className="rounded-full h-11 font-semibold mt-2">
                            {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Creating account...</> : "Create NGO Account"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}
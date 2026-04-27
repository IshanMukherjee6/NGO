// src/pages/RegisterWorker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Changes from original:
//  • PAN validation — real format enforced:
//      AAAXX9999A  (3 letters · type char · surname char · 4 digits · check letter)
//      Uppercase auto-converted; invalid chars blocked; real regex check on submit.
//  • State dropdown — all 36 Indian states/UTs from indiaData.ts
//  • District dropdown — cascades from selected state (exact districts)
//  • City dropdown — cascades from selected district (real cities)
//  • District moved to LEFT, City moved to RIGHT (as requested)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Loader2, Eye, EyeOff } from "lucide-react"
import { INDIA_DATA } from "../lib/indiaData"

// ── PAN Validation ─────────────────────────────────────────────────────────────
// Format: AAAXX9999A
//   pos 0-2  : any 3 uppercase letters
//   pos 3    : taxpayer type — P C H F A T B L J G
//   pos 4    : first letter of surname / entity name (uppercase letter)
//   pos 5-8  : 4 digits
//   pos 9    : uppercase check letter
const PAN_TYPE_CHARS = new Set(["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"])
const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const PAN_REGEX = /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/

function validatePAN(pan: string): string | null {
    if (pan.length === 0) return "PAN number is required."
    if (pan.length !== 10) return "PAN must be exactly 10 characters."
    if (!PAN_REGEX.test(pan)) {
        if (!/^[A-Z]{3}/.test(pan)) return "First 3 characters must be letters (A-Z)."
        if (!PAN_TYPE_CHARS.has(pan[3])) return `4th character must be a valid type: P, C, H, F, A, T, B, L, J, or G.`
        if (!/^[A-Z]$/.test(pan[4])) return "5th character must be a letter (A-Z)."
        if (!/^[0-9]{4}$/.test(pan.slice(5, 9))) return "Characters 6–9 must be digits."
        if (!/^[A-Z]$/.test(pan[9])) return "Last character must be a letter (A-Z)."
        return "Invalid PAN format. Expected format: ABCDE1234F"
    }
    return null // valid
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white " +
    "placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 " +
    "focus:border-white/30 transition-all"

const errorCls = "text-xs text-red-400 mt-1"

// ── Cascading location select ──────────────────────────────────────────────────

function LocationSelect({
    placeholder,
    options,
    value,
    onChange,
    disabled,
}: {
    placeholder: string
    options: string[]
    value: string
    onChange: (v: string) => void
    disabled?: boolean
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className={`${inputCls} appearance-none pr-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
            >
                <option value="" className="bg-zinc-900 text-white/50">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
                ))}
            </select>
            <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
        </div>
    )
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
    return (
        <div className="flex items-center gap-3 mb-8">
            {[
                { n: 1, label: "Personal Details" },
                { n: 2, label: "Account Setup" },
            ].map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-2">
                    {i > 0 && <div className={`h-px w-10 ${step > 1 ? "bg-white/60" : "bg-white/20"}`} />}
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === n ? "bg-white text-black" : step > n ? "bg-white/70 text-black" : "bg-white/10 text-white/50"}`}>
                            {n}
                        </div>
                        <span className={`text-sm ${step === n ? "text-white font-semibold" : "text-white/40"}`}>
                            {label}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({
    label, required = true, error, children,
}: {
    label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white/80">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className={errorCls}>{error}</p>}
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RegisterWorker() {
    const { signUpWorker } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // ── Form fields ──────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState("")
    const [age, setAge] = useState("")
    const [phone, setPhone] = useState("")
    const [panRaw, setPanRaw] = useState("")   // always uppercase internally
    const [country] = useState("India")
    const [state, setState] = useState("")
    const [district, setDistrict] = useState("")
    const [city, setCity] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPass, setConfirmPass] = useState("")

    // ── Errors ───────────────────────────────────────────────────────────────
    const [errors, setErrors] = useState<Record<string, string>>({})

    // ── Derived location options ──────────────────────────────────────────────
    const stateOptions = Object.keys(INDIA_DATA).sort()
    const districtOptions = state ? Object.keys(INDIA_DATA[state] ?? {}).sort() : []
    const cityOptions = (state && district) ? (INDIA_DATA[state]?.[district] ?? []).sort() : []

    // Reset downstream on cascade change
    const handleStateChange = (v: string) => {
        setState(v); setDistrict(""); setCity("")
    }
    const handleDistrictChange = (v: string) => {
        setDistrict(v); setCity("")
    }

    // PAN: auto-uppercase, max 10 chars
    const handlePanInput = (raw: string) => {
        const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
        setPanRaw(upper)
        if (errors.pan) setErrors(prev => { const e = { ...prev }; delete e.pan; return e })
    }

    // ── Step 1 validation ─────────────────────────────────────────────────────
    const validateStep1 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!fullName.trim()) errs.fullName = "Full name is required."
        if (!age || parseInt(age) < 18 || parseInt(age) > 65)
            errs.age = "Age must be between 18 and 65."
        if (!phone.match(/^[6-9]\d{9}$/))
            errs.phone = "Enter a valid 10-digit Indian mobile number."

        const panErr = validatePAN(panRaw)
        if (panErr) errs.pan = panErr

        if (!state) errs.state = "Please select a state."
        if (!district) errs.district = "Please select a district."
        if (!city) errs.city = "Please select a city."

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    // ── Step 2 validation ─────────────────────────────────────────────────────
    const validateStep2 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!username.trim() || username.length < 4)
            errs.username = "Username must be at least 4 characters."
        if (!PASSWORD_REGEX.test(password)) {
            errs.password =
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        }
        if (password !== confirmPass)
            errs.confirmPass = "Passwords do not match."
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleContinue = () => {
        if (validateStep1()) setStep(2)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateStep2()) return
        setLoading(true)
        try {
            await signUpWorker({
                fullName: fullName.trim(),
                age,
                phone,
                panNumber: panRaw,
                country,
                state,
                city,
                district,
                username: username.trim(),
                password,
            })
            showToast("Account created successfully!", "success")
            navigate("/dashboard")
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Registration failed."
            showToast(msg.includes("already") ? "Username already taken." : msg, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-lg">
                {/* Back link */}
                <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={15} /> Back to register
                </Link>

                <h1 className="text-3xl font-bold text-white mb-1">Register as a Worker</h1>
                <p className="text-white/50 text-sm mb-8">Set up your login credentials.</p>

                <StepIndicator step={step} />

                {step === 1 ? (
                    /* ── Step 1: Personal Details ─────────────────────────── */
                    <div className="flex flex-col gap-5">
                        {/* Full Name + Age */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Full Name" error={errors.fullName}>
                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className={`${inputCls} ${errors.fullName ? "border-red-500/50" : ""}`}
                                />
                            </Field>
                            <Field label="Age" error={errors.age}>
                                <input
                                    type="number"
                                    min="18" max="65"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    placeholder="e.g. 28"
                                    className={`${inputCls} ${errors.age ? "border-red-500/50" : ""}`}
                                />
                            </Field>
                        </div>

                        {/* Phone */}
                        <Field label="Phone Number" error={errors.phone}>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40 select-none">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="98765 43210"
                                    className={`${inputCls} pl-12 ${errors.phone ? "border-red-500/50" : ""}`}
                                />
                            </div>
                        </Field>

                        {/* PAN */}
                        <Field label="PAN Number" error={errors.pan}>
                            <input
                                value={panRaw}
                                onChange={e => handlePanInput(e.target.value)}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                spellCheck={false}
                                className={`${inputCls} font-mono tracking-widest ${errors.pan ? "border-red-500/50" : panRaw.length === 10 && !validatePAN(panRaw) ? "border-green-500/40" : ""}`}
                            />
                            {panRaw.length === 10 && !validatePAN(panRaw) && (
                                <p className="text-xs text-green-400 mt-1">✓ Valid PAN format</p>
                            )}
                            <p className="text-xs text-white/25 mt-1">
                                Format: 3 letters · type (P/C/H/F/A/T/B/L/J/G) · letter · 4 digits · letter
                            </p>
                        </Field>

                        {/* Home Location heading */}
                        <div>
                            <p className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                                Home Location
                            </p>

                            {/* Country + State */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Field label="Country">
                                    <input
                                        value={country}
                                        readOnly
                                        className={`${inputCls} opacity-50 cursor-not-allowed`}
                                    />
                                </Field>
                                <Field label="State" error={errors.state}>
                                    <LocationSelect
                                        placeholder="Select State"
                                        options={stateOptions}
                                        value={state}
                                        onChange={handleStateChange}
                                    />
                                </Field>
                            </div>

                            {/* District (LEFT) + City (RIGHT) — swapped as requested */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="District" error={errors.district}>
                                    <LocationSelect
                                        placeholder={state ? "Select District" : "Select state first"}
                                        options={districtOptions}
                                        value={district}
                                        onChange={handleDistrictChange}
                                        disabled={!state}
                                    />
                                </Field>
                                <Field label="City" error={errors.city}>
                                    <LocationSelect
                                        placeholder={district ? "Select City" : "Select district first"}
                                        options={cityOptions}
                                        value={city}
                                        onChange={setCity}
                                        disabled={!district}
                                    />
                                </Field>
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            className="w-full rounded-2xl h-12 font-semibold mt-2 flex items-center justify-center gap-2"
                        >
                            Continue →
                        </Button>
                    </div>
                ) : (
                    /* ── Step 2: Account Setup ────────────────────────────── */
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <Field label="Username" error={errors.username}>
                            <input
                                value={username}
                                onChange={e => setUsername(e.target.value.trim())}
                                placeholder="Choose a username"
                                autoComplete="username"
                                className={`${inputCls} ${errors.username ? "border-red-500/50" : ""}`}
                            />
                        </Field>

                        <Field label="Password" error={errors.password}>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    className={`${inputCls} pr-11 ${errors.password ? "border-red-500/50" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Confirm Password" error={errors.confirmPass}>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    className={`${inputCls} pr-11 ${errors.confirmPass ? "border-red-500/50" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* 👇 ADD THIS */}
                            <p className="text-xs text-white/25 mt-1">
                                Must match the password above
                            </p>
                        </Field>

                        <div className="flex gap-3 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1 rounded-2xl h-12 font-semibold border-white/10 text-white hover:bg-white/5"
                            >
                                ← Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-2 flex-1 rounded-2xl h-12 font-semibold"
                            >
                                {loading
                                    ? <><Loader2 size={16} className="animate-spin mr-2" />Creating account...</>
                                    : "Create Account"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
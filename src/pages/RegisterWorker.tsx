// src/pages/RegisterWorker.tsx
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Loader2, Eye, EyeOff, X, Plus } from "lucide-react"
import { INDIA_DATA } from "../lib/indiaData"
import {
    EDUCATION_OPTIONS,
    EXPERIENCE_OPTIONS,
    type EducationLevel,
    type ExperienceLevel,
} from "../lib/authService"

const SKILL_SUGGESTIONS = [
    "First Aid", "Local Language", "Two-wheeler Licence", "Computer Basic",
    "Teaching", "Cooking", "Driving", "Counselling", "Fundraising",
    "Data Entry", "Photography", "Field Survey", "Childcare", "Sanitation",
]

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const PAN_REGEX = /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/

function validatePAN(pan: string): string | null {
    if (pan.length === 0) return "PAN number is required."
    if (pan.length !== 10) return "PAN must be exactly 10 characters."
    if (!PAN_REGEX.test(pan)) return "Invalid PAN format. Expected: ABCDE1234F"
    return null
}

const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white " +
    "placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 " +
    "focus:border-white/30 transition-all"
const errorCls = "text-xs text-red-400 mt-1"

function LocationSelect({ placeholder, options, value, onChange, disabled }: {
    placeholder: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                className={`${inputCls} appearance-none pr-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}>
                <option value="" className="bg-zinc-900 text-white/50">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
    )
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
    return (
        <div className="flex items-center gap-3 mb-8">
            {[
                { n: 1, label: "Personal Details" },
                { n: 2, label: "Qualifications" },
                { n: 3, label: "Account Setup" },
            ].map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-2">
                    {i > 0 && <div className={`h-px w-10 ${step > (n - 1) ? "bg-white/60" : "bg-white/20"}`} />}
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === n ? "bg-white text-black" : step > n ? "bg-white/70 text-black" : "bg-white/10 text-white/50"}`}>{n}</div>
                        <span className={`text-sm ${step === n ? "text-white font-semibold" : "text-white/40"}`}>{label}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function Field({ label, required = true, error, children }: {
    label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white/80">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
            {children}
            {error && <p className={errorCls}>{error}</p>}
        </div>
    )
}

export default function RegisterWorker() {
    const { signUpWorker } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Step 1 — Personal Details
    const [fullName, setFullName] = useState("")
    const [age, setAge] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [panRaw, setPanRaw] = useState("")
    const [country] = useState("India")
    const [state, setState] = useState("")
    const [district, setDistrict] = useState("")
    const [city, setCity] = useState("")

    // Step 2 — Qualifications
    const [education, setEducation] = useState<EducationLevel | "">("")
    const [experience, setExperience] = useState<ExperienceLevel | "">("")
    const [skills, setSkills] = useState<string[]>([])
    const [skillInput, setSkillInput] = useState("")

    // Step 3 — Account Setup
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPass, setConfirmPass] = useState("")

    const [errors, setErrors] = useState<Record<string, string>>({})

    const stateOptions = Object.keys(INDIA_DATA).sort()
    const districtOptions = state ? Object.keys(INDIA_DATA[state] ?? {}).sort() : []
    const cityOptions = (state && district) ? (INDIA_DATA[state]?.[district] ?? []).sort() : []

    const handleStateChange = (v: string) => { setState(v); setDistrict(""); setCity("") }
    const handleDistrictChange = (v: string) => { setDistrict(v); setCity("") }

    const handlePanInput = (raw: string) => {
        const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
        setPanRaw(upper)
        if (errors.pan) setErrors(prev => { const e = { ...prev }; delete e.pan; return e })
    }

    const addSkill = (raw: string) => {
        const trimmed = raw.trim()
        if (!trimmed) return
        const exists = skills.some(s => s.toLowerCase() === trimmed.toLowerCase())
        if (exists) { setSkillInput(""); return }
        setSkills(prev => [...prev, trimmed])
        setSkillInput("")
        if (errors.skills) setErrors(prev => { const e = { ...prev }; delete e.skills; return e })
    }
    const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

    const validateStep1 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!fullName.trim()) errs.fullName = "Full name is required."
        const ageNum = parseInt(age)
        if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 65)
            errs.age = "Age must be between 18 and 65."
        if (!phone.match(/^[6-9]\d{9}$/))
            errs.phone = "Enter a valid 10-digit Indian mobile number."
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errs.email = "Enter a valid email address."
        const panErr = validatePAN(panRaw)
        if (panErr) errs.pan = panErr
        if (!state) errs.state = "Please select a state."
        if (!district) errs.district = "Please select a district."
        if (!city) errs.city = "Please select a city."
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const validateStep2 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!education) errs.education = "Please select your highest education."
        if (!experience) errs.experience = "Please select your experience level."
        if (skills.length === 0) errs.skills = "Add at least one skill."
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const validateStep3 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!username.trim() || username.length < 4) errs.username = "Username must be at least 4 characters."
        if (!PASSWORD_REGEX.test(password)) {
            errs.password = "Password must be 8+ chars with uppercase, lowercase, number, and special character."
        }
        if (password !== confirmPass) errs.confirmPass = "Passwords do not match."
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleContinueFromStep1 = () => { if (validateStep1()) setStep(2) }
    const handleContinueFromStep2 = () => { if (validateStep2()) setStep(3) }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateStep3()) return
        // Re-validate step 2 defensively in case user navigated back and cleared fields
        if (!validateStep2()) { setStep(2); return }
        setLoading(true)
        try {
            await signUpWorker({
                fullName: fullName.trim(), age, phone, email,
                panNumber: panRaw, country, state, city, district,
                username: username.trim(), password,
                education: education as EducationLevel,
                experience: experience as ExperienceLevel,
                skills,
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
                <Link to="/register" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-8">
                    <ArrowLeft size={15} /> Back to register
                </Link>
                <h1 className="text-3xl font-bold text-white mb-1">Register as a Worker</h1>
                <p className="text-white/50 text-sm mb-8">Set up your profile and account.</p>
                <StepIndicator step={step} />

                {/* ── STEP 1: Personal Details ── */}
                {step === 1 ? (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Full Name" error={errors.fullName}>
                                <input value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className={`${inputCls} ${errors.fullName ? "border-red-500/50" : ""}`} />
                            </Field>
                            <Field label="Age (18–65)" error={errors.age}>
                                <input type="number" min="18" max="65" value={age}
                                    onChange={e => setAge(e.target.value)} placeholder="e.g. 28"
                                    className={`${inputCls} ${errors.age ? "border-red-500/50" : ""}`} />
                            </Field>
                        </div>

                        <Field label="Phone Number" error={errors.phone}>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40 select-none">+91</span>
                                <input type="tel" maxLength={10} value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="98765 43210"
                                    className={`${inputCls} pl-12 ${errors.phone ? "border-red-500/50" : ""}`} />
                            </div>
                        </Field>

                        <Field label="Email Address" error={errors.email}>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className={`${inputCls} ${errors.email ? "border-red-500/50" : ""}`} />
                        </Field>

                        <Field label="PAN Number" error={errors.pan}>
                            <input value={panRaw} onChange={e => handlePanInput(e.target.value)}
                                placeholder="ABCDE1234F" maxLength={10} spellCheck={false}
                                className={`${inputCls} font-mono tracking-widest ${errors.pan ? "border-red-500/50" : panRaw.length === 10 && !validatePAN(panRaw) ? "border-green-500/40" : ""}`} />
                            {panRaw.length === 10 && !validatePAN(panRaw) && (
                                <p className="text-xs text-green-400 mt-1">✓ Valid PAN format</p>
                            )}
                            <p className="text-xs text-white/25 mt-1">Format: 3 letters · type · letter · 4 digits · letter</p>
                        </Field>

                        <div>
                            <p className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Home Location</p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Field label="Country">
                                    <input value={country} readOnly className={`${inputCls} opacity-50 cursor-not-allowed`} />
                                </Field>
                                <Field label="State" error={errors.state}>
                                    <LocationSelect placeholder="Select State" options={stateOptions} value={state} onChange={handleStateChange} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="District" error={errors.district}>
                                    <LocationSelect placeholder={state ? "Select District" : "Select state first"}
                                        options={districtOptions} value={district} onChange={handleDistrictChange} disabled={!state} />
                                </Field>
                                <Field label="City" error={errors.city}>
                                    <LocationSelect placeholder={district ? "Select City" : "Select district first"}
                                        options={cityOptions} value={city} onChange={setCity} disabled={!district} />
                                </Field>
                            </div>
                        </div>

                        <Button onClick={handleContinueFromStep1} className="w-full rounded-2xl h-12 font-semibold mt-2">Continue →</Button>
                    </div>

                ) : step === 2 ? (
                    /* ── STEP 2: Qualifications ── */
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Education & Experience</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Highest Education" error={errors.education}>
                                    <LocationSelect
                                        placeholder="Select"
                                        options={[...EDUCATION_OPTIONS]}
                                        value={education}
                                        onChange={(v) => {
                                            setEducation(v as EducationLevel)
                                            if (errors.education) setErrors(prev => { const e = { ...prev }; delete e.education; return e })
                                        }}
                                    />
                                </Field>
                                <Field label="Experience Level" error={errors.experience}>
                                    <LocationSelect
                                        placeholder="Select"
                                        options={[...EXPERIENCE_OPTIONS]}
                                        value={experience}
                                        onChange={(v) => {
                                            setExperience(v as ExperienceLevel)
                                            if (errors.experience) setErrors(prev => { const e = { ...prev }; delete e.experience; return e })
                                        }}
                                    />
                                </Field>
                            </div>
                        </div>

                        <Field label="Skills (add at least one)" error={errors.skills}>
                            <div className={`${inputCls} min-h-12 flex flex-wrap items-center gap-2 ${errors.skills ? "border-red-500/50" : ""}`}>
                                {skills.map(s => (
                                    <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-white">
                                        {s}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(s)}
                                            className="text-white/50 hover:text-white"
                                            aria-label={`Remove ${s}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === ",") {
                                            e.preventDefault()
                                            addSkill(skillInput)
                                        } else if (e.key === "Backspace" && !skillInput && skills.length > 0) {
                                            removeSkill(skills[skills.length - 1])
                                        }
                                    }}
                                    placeholder={skills.length === 0 ? "Type a skill and press Enter" : "Add another…"}
                                    className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-white/30"
                                />
                            </div>
                            <p className="text-xs text-white/25 mt-1.5">Press Enter or comma to add. Suggestions:</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {SKILL_SUGGESTIONS
                                    .filter(s => !skills.some(picked => picked.toLowerCase() === s.toLowerCase()))
                                    .map(s => (
                                        <button
                                            type="button"
                                            key={s}
                                            onClick={() => addSkill(s)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/15 text-xs text-white/70 hover:border-white/40 hover:text-white transition-colors"
                                        >
                                            <Plus size={10} /> {s}
                                        </button>
                                    ))}
                            </div>
                        </Field>

                        <div className="flex gap-3 mt-2">
                            <Button type="button" variant="outline" onClick={() => setStep(1)}
                                className="flex-1 rounded-2xl h-12 font-semibold border-white/10 text-white hover:bg-white/5">← Back</Button>
                            <Button onClick={handleContinueFromStep2} className="flex-1 rounded-2xl h-12 font-semibold">Continue →</Button>
                        </div>
                    </div>

                ) : (
                    /* ── STEP 3: Account Setup ── */
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <Field label="Username" error={errors.username}>
                            <input value={username} onChange={e => setUsername(e.target.value.trim())}
                                placeholder="Choose a username" autoComplete="username"
                                className={`${inputCls} ${errors.username ? "border-red-500/50" : ""}`} />
                        </Field>
                        <Field label="Password" error={errors.password}>
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} value={password}
                                    onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    className={`${inputCls} pr-11 ${errors.password ? "border-red-500/50" : ""}`} />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </Field>
                        <Field label="Confirm Password" error={errors.confirmPass}>
                            <div className="relative">
                                <input type={showConfirm ? "text" : "password"} value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    className={`${inputCls} pr-11 ${errors.confirmPass ? "border-red-500/50" : ""}`} />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </Field>
                        <div className="flex gap-3 mt-2">
                            <Button type="button" variant="outline" onClick={() => setStep(2)}
                                className="flex-1 rounded-2xl h-12 font-semibold border-white/10 text-white hover:bg-white/5">← Back</Button>
                            <Button type="submit" disabled={loading} className="flex-1 rounded-2xl h-12 font-semibold">
                                {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Creating...</> : "Create Account"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
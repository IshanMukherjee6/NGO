// src/context/ToastContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Replaces Project 2's Alert.js + showAlert prop-drilling pattern.
// Provides a global toast system usable from any component via useToast().
// ─────────────────────────────────────────────────────────────────────────────

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info"

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2)
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3500)
    }, [])

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle size={16} className="text-green-500 flex-shrink-0" />,
        error: <AlertCircle size={16} className="text-red-500 flex-shrink-0" />,
        info: <Info size={16} className="text-blue-500 flex-shrink-0" />,
    }

    const borders: Record<ToastType, string> = {
        success: "border-green-500/20",
        error: "border-red-500/20",
        info: "border-blue-500/20",
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 bg-background border ${borders[toast.type]} rounded-2xl px-4 py-3 shadow-lg text-sm text-foreground font-medium pointer-events-auto min-w-[260px] max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        {icons[toast.type]}
                        <span className="flex-1">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within ToastProvider")
    return ctx
}
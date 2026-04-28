import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

type SalaryInputProps = {
    value: string
    onChange: (val: string) => void
    min?: number
    step?: number
    placeholder?: string
}

export default function SalaryInput({
    value,
    onChange,
    min = 0,
    step = 1000,
    placeholder = "e.g. 15000",
}: SalaryInputProps) {
    const numericValue = parseInt(value) || 0

    const increment = () => {
        const newVal = Math.max(min, numericValue + step)
        onChange(String(newVal))
    }

    const decrement = () => {
        const newVal = Math.max(min, numericValue - step)
        onChange(String(newVal))
    }

    return (
        <div className="relative w-full">
            {/* Input */}
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "") // only numbers
                    onChange(val)
                }}
                placeholder={placeholder}
                className="
          w-full h-11 pl-3 pr-10
          rounded-xl

          bg-[#222]/80
          border border-white/10

          text-sm text-foreground
          placeholder:text-muted-foreground

          hover:bg-[#2a2a2a]
          focus:ring-2 focus:ring-white/20

          transition-all
        "
            />

            {/* Controls */}
            <div className="absolute right-1 top-1 bottom-1 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#2a2a2a]">

                <button
                    type="button"
                    onClick={increment}
                    className="
            flex items-center justify-center
            w-6 h-1/2

            text-white/70
            hover:bg-white/10
            hover:text-white

            transition-all
          "
                >
                    <ChevronUp size={14} />
                </button>

                <div className="h-[1px] bg-white/10" />

                <button
                    type="button"
                    onClick={decrement}
                    className="
            flex items-center justify-center
            w-6 h-1/2

            text-white/70
            hover:bg-white/10
            hover:text-white

            transition-all
          "
                >
                    <ChevronDown size={14} />
                </button>
            </div>
        </div>
    )
}
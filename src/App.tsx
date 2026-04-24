import { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import { Button } from "@/components/ui/button"

const slides = [
  {
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80",
    tag: "Field Operations",
    heading: "Connecting NGOs with the Right Workers",
    sub: "Real-time job assignment based on priority and location — so help reaches where it's needed most.",
  },
  {
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1600&q=80",
    tag: "Data Collection",
    heading: "Empower NGOs with Seamless Data Upload",
    sub: "Upload, manage and track field data with a secure dashboard built for NGO teams.",
  },
  {
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80",
    tag: "Smart Matching",
    heading: "Workers Assigned by Priority & Location",
    sub: "Our platform ensures every worker is placed where they can create the maximum impact.",
  },
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setVisible(true)
      }, 600)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i: number) => {
    if (i === current) return
    setVisible(false)
    setTimeout(() => { setCurrent(i); setVisible(true) }, 400)
  }

  const slide = slides[current]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-screen w-full overflow-hidden">

        {/* Background images — preload all, crossfade active */}
        {slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
            style={{
              backgroundImage: `url(${s.image})`,
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/10 to-transparent" />

        {/* Slide dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-[3px] rounded-full transition-all duration-500 cursor-pointer ${i === current ? "w-8 bg-white" : "w-2.5 bg-white/35 hover:bg-white/60"
                }`}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-5xl mx-auto px-6 md:px-14">
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {/* Tag pill */}
            <span className="inline-block mb-5 px-3.5 py-1 text-[11px] tracking-[0.18em] uppercase font-semibold bg-white/10 border border-white/20 text-white/75 rounded-full backdrop-blur-sm">
              {slide.tag}
            </span>

            {/* Main heading */}
            <h1
              className="text-4xl md:text-6xl lg:text-[68px] font-bold text-white leading-[1.08] mb-6 max-w-3xl"
              style={{ letterSpacing: "-0.025em" }}
            >
              {slide.heading}
            </h1>

            {/* Subtitle */}
            <p className="text-white/65 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full px-7 bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
              >
                Join as a Worker
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm font-semibold"
              >
                Register your NGO →
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom page-bg fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6 md:px-14 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { value: "500+", label: "NGO Partners" },
            { value: "12K+", label: "Workers Placed" },
            { value: "28", label: "States Covered" },
            { value: "98%", label: "Assignment Accuracy" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-muted-foreground text-sm mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-6 md:px-14 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-3 font-semibold">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Built for NGOs and Field Workers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "📋",
                title: "NGO uploads data",
                desc: "NGOs log in, upload field requirements, and define job priorities across locations.",
              },
              {
                step: "02",
                icon: "⚙️",
                title: "Smart job matching",
                desc: "The platform assigns tasks to workers automatically based on location and urgency.",
              },
              {
                step: "03",
                icon: "✅",
                title: "Workers take action",
                desc: "Workers receive assignments, update status, and coordinate seamlessly on the ground.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl border border-border bg-background hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-mono text-muted-foreground/50 font-semibold">{s.step}</span>
                </div>
                <h3 className="font-semibold text-[17px] mb-2 tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 md:px-14 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Ready to make an impact?
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
          Join hundreds of NGOs and thousands of workers already using NGO Connect.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" className="rounded-full px-8 font-semibold">
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold">
            Learn More
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-6 text-center text-muted-foreground text-sm">
        <p>© 2025 NGO Connect. All rights reserved.</p>
      </footer>
    </div>
  )
}

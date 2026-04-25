import { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"
import About from "./pages/About"
import { Button } from "@/components/ui/button"

import Register from "./pages/Register"
import RegisterNGO from "./pages/RegisterNGO"
import RegisterWorker from "./pages/RegisterWorker"

import Login from "./pages/Login"
const slides = [
  {
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80",
    heading: "Connecting NGOs with the Right Workers",
    sub: "Real-time job assignment based on priority and location — so help reaches where it's needed most.",
  },
  {
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1600&q=80",
    heading: "Empower NGOs with Seamless Data Upload",
    sub: "Upload, manage and track field data with a secure dashboard built for NGO teams.",
  },
  {
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80",
    heading: "Workers Assigned by Priority & Location",
    sub: "Our platform ensures every worker is placed where they can create the maximum impact.",
  },
]

function Home() {
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
    setTimeout(() => {
      setCurrent(i)
      setVisible(true)
    }, 400)
  }

  const slide = slides[current]

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/10 to-transparent" />

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-[3px] rounded-full transition-all duration-500 ${i === current ? "w-8 bg-white" : "w-2.5 bg-white/35"
                }`}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full max-w-5xl mx-auto px-6 md:px-14">
          <h1 className="text-5xl font-bold text-white mb-6">
            {slide.heading}
          </h1>
          <p className="text-white/70 mb-8">{slide.sub}</p>

          <div className="flex gap-3">
            <Button>Join as Worker</Button>
            <Button variant="outline">Register NGO</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 text-center text-sm">
        © 2025 NGO Connect
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/ngo" element={<RegisterNGO />} />
        <Route path="/register/worker" element={<RegisterWorker />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

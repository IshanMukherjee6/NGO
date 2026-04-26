// src/pages/About.tsx
// Visually unchanged from Project 1.

export default function About() {
    return (
        <section className="min-h-screen pt-28 pb-16 px-6 md:px-14 bg-background">
            <div className="max-w-5xl mx-auto">

                <div className="bg-muted/40 border border-border rounded-3xl p-10 md:p-14">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-3 font-semibold">
                        How it works
                    </p>

                    <h2
                        className="text-3xl md:text-4xl font-bold mb-12 tracking-tight"
                        style={{ letterSpacing: "-0.02em" }}
                    >
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

                    {/* Extra info section */}
                    <div className="mt-14 pt-10 border-t border-border">
                        <h3 className="text-xl font-bold text-foreground mb-4">About NGO Connect</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm max-w-2xl">
                            NGO Connect is a platform that bridges the gap between NGOs and skilled field workers across India.
                            By leveraging real-time data and location-based matching, we ensure that every NGO gets the right
                            workers for their projects, and every worker gets fair employment opportunities close to home.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
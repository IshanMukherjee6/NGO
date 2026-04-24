export default function About() {
    return (
        <section className="py-16 px-6 md:px-14 bg-muted/40 border-y border-border">

            {/* ── How it works ── */}

            <div className="max-w-5xl mx-auto">
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
                                <span className="text-xs font-mono text-muted-foreground/50 font-semibold">
                                    {s.step}
                                </span>
                            </div>

                            <h3 className="font-semibold text-[17px] mb-2 tracking-tight">
                                {s.title}
                            </h3>

                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
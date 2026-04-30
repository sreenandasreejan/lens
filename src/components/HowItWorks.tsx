const steps = [
  { n: "01", title: "Pick a tour", desc: "Browse curated historical journeys across the globe — from Rome to Kyoto." },
  { n: "02", title: "Arrive on location", desc: "Open ChronoLens at the site. We detect where you are and unlock the experience." },
  { n: "03", title: "Step into history", desc: "Raise your phone. Watch the past unfold around you with audio, AR, and story." },
];

export const HowItWorks = () => (
  <section id="how" className="py-24 relative">
    <div className="container">
      <div className="text-center mb-16">
        <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">How it works</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold mt-4">Three steps to time travel.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 relative">
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {steps.map(({ n, title, desc }) => (
          <div key={n} className="relative text-center p-8 rounded-2xl bg-gradient-card border border-border/60">
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-background border border-primary/40 flex items-center justify-center font-display font-bold text-lg text-primary mb-5 shadow-glow">
              {n}
            </div>
            <h3 className="font-display font-semibold text-xl mb-3">{title}</h3>
            <p className="text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

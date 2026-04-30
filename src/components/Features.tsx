import { Camera, Headphones, Compass, Trophy } from "lucide-react";

const features = [
  { icon: Camera, title: "Location-Based AR", desc: "Hold your phone up at any landmark and watch history come alive in 3D, layered onto the real world." },
  { icon: Headphones, title: "Cinematic Audio Stories", desc: "Hand-crafted narrations from historians and storytellers — feel each moment, don't just read about it." },
  { icon: Compass, title: "Curated Guided Tours", desc: "Multi-stop journeys through legendary cities, designed by experts with the perfect pacing." },
  { icon: Trophy, title: "Track Your Journey", desc: "Earn badges, save favorite locations, and watch your personal history map fill up over time." },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">Features</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-5">
            Built for the curious.<br/>
            <span className="text-gold">Designed for wonder.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to turn any historical site into an unforgettable, immersive experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="group relative p-7 rounded-2xl bg-gradient-card border border-border/60 transition-smooth hover:border-primary/50 hover:-translate-y-1 shadow-card"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-5 transition-smooth group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

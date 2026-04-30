import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tiers = [
  { name: "Explorer", price: "Free", desc: "Try ChronoLens at iconic sites.",
    features: ["3 free tours per month", "Audio stories", "Basic AR previews"], cta: "Start free", variant: "glass" as const },
  { name: "Traveler", price: "$9", period: "/mo", desc: "For active history lovers.", featured: true,
    features: ["Unlimited tours", "Full AR experiences", "Offline mode", "Save favorite locations", "Progress tracking"], cta: "Go Traveler", variant: "hero" as const },
  { name: "Scholar", price: "$19", period: "/mo", desc: "For educators & teams.",
    features: ["Everything in Traveler", "Group tours (10 seats)", "Lesson plan exports", "Priority support"], cta: "Contact us", variant: "outline" as const },
];

export const Pricing = () => (
  <section id="pricing" className="py-24 relative">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">Pricing</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-4">Choose your journey.</h2>
        <p className="text-muted-foreground text-lg">No hidden fees. Cancel anytime.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((t) => (
          <div key={t.name}
            className={`relative p-8 rounded-2xl border transition-smooth ${
              t.featured
                ? "border-primary/60 bg-gradient-card shadow-glow scale-[1.02]"
                : "border-border/60 bg-gradient-card hover:border-primary/40"
            }`}>
            {t.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-semibold mb-1">{t.name}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t.desc}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-5xl font-bold">{t.price}</span>
              {t.period && <span className="text-muted-foreground">{t.period}</span>}
            </div>
            <Button asChild variant={t.variant} className="w-full mb-7">
              <Link to="/auth">{t.cta}</Link>
            </Button>
            <ul className="space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

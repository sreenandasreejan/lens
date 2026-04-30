import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, MapPin, Box, Headphones, Map, Star } from "lucide-react";
import heroImg from "@/assets/chronolens-hero.png";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] -z-10" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] -z-10" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-primary" />
              <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                Augmented Reality Tours
              </span>
            </div>

            <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              See history{" "}
              <span className="block">where it</span>
              <span className="text-gold">actually</span>{" "}
              <span>happened.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
              Point your camera. Step into the past. Immersive stories,
              cinematic visuals, and curated tours of the world&apos;s most
              legendary places.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button asChild variant="hero" size="lg">
                <Link to="/auth">
                  <MapPin className="!size-5" />
                  Explore Tours
                </Link>
              </Button>
              <Button variant="glass" size="lg">
                <Play className="!size-5 fill-current" />
                Watch Demo
              </Button>
            </div>

            {/* Mini features */}
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: Box, title: "AR Experiences", sub: "Live in real world" },
                { icon: Headphones, title: "Audio Stories", sub: "Engaging narration" },
                { icon: Map, title: "Guided Tours", sub: "Curated for you" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/10 blur-3xl -z-10" />
            <img
              src={heroImg}
              alt="ChronoLens AR experience showing the Colosseum in Rome through a smartphone"
              className="w-full h-auto rounded-3xl shadow-elegant animate-float"
              loading="eager"
            />
          </div>
        </div>

        {/* Trust */}
        <div className="mt-20 pt-10 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground mb-5">
            Trusted by educators, travelers &amp; history lovers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
              <span className="text-sm font-semibold ml-1">4.8/5</span>
            </div>
            {["Google", "Trustpilot", "Capterra", "GetApp"].map((b) => (
              <span key={b} className="text-sm font-semibold tracking-wide">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

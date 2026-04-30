import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
    <div className="relative">
      <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow transition-smooth group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute inset-0 rounded-xl bg-primary/40 blur-xl -z-10 animate-glow-pulse" />
    </div>
    <span className="font-display font-bold text-xl tracking-tight">
      Chrono<span className="text-gold">Lens</span>
    </span>
  </Link>
);

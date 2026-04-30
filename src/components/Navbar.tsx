import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const navItems = ["Features", "Tours", "Pricing", "Blog", "About"];

export const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="container flex items-center justify-between py-5">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
            Log In
          </Link>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

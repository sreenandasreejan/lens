import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-border/40 py-12 mt-12">
    <div className="container grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <Logo />
        <p className="text-sm text-muted-foreground mt-4 max-w-xs">
          Augmented reality tours that bring the past to life — wherever it actually happened.
        </p>
      </div>
      {[
        { title: "Product", links: ["Features", "Tours", "Pricing", "Download"] },
        { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="font-semibold mb-4 text-sm">{col.title}</h4>
          <ul className="space-y-2.5">
            {col.links.map((l) => (
              <li key={l}>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="container mt-10 pt-6 border-t border-border/40 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
      <p>© {new Date().getFullYear()} ChronoLens. All rights reserved.</p>
      <p>Crafted for the curious.</p>
    </div>
  </footer>
);

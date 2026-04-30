import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import heroImg from "@/assets/chronolens-hero.png";
import { useAuth } from "@/hooks/useAuth";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});
const loginSchema = signupSchema.pick({ email: true, password: true });

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === "signup" ? signupSchema : loginSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = mode === "signup"
        ? await signUp(form.email, form.password, form.name)
        : await signIn(form.email, form.password);

      if (error) {
        const msg = error.message.includes("already registered")
          ? "This email is already registered. Try logging in."
          : error.message.includes("Invalid login")
          ? "Invalid email or password."
          : error.message;
        toast.error(msg);
        return;
      }
      toast.success(mode === "signup" ? "Welcome to ChronoLens!" : "Welcome back!");
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Logo />
        <div className="max-w-md w-full mx-auto py-12">
          <h1 className="font-display text-4xl font-bold mb-2">
            {mode === "login" ? "Welcome back." : "Begin your journey."}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? "Step back into history where you left off." : "Create an account and unlock the past."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field icon={User} label="Name" type="text" value={form.name}
                onChange={(v) => setForm({ ...form, name: v })} error={errors.name} placeholder="Marco Polo" />
            )}
            <Field icon={Mail} label="Email" type="email" value={form.email}
              onChange={(v) => setForm({ ...form, email: v })} error={errors.email} placeholder="you@chronolens.com" />
            <Field icon={Lock} label="Password" type="password" value={form.password}
              onChange={(v) => setForm({ ...form, password: v })} error={errors.password} placeholder="••••••••" />

            <Button type="submit" variant="hero" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
              <ArrowRight className="!size-5" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "login" ? "New here? " : "Already a traveler? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
              className="text-primary font-semibold hover:underline">
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-smooth">← Back to home</Link>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-midnight">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo/40 via-transparent to-primary/20" />
        <img src={heroImg} alt="ChronoLens AR" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase mb-3">— Featured tour</p>
          <h2 className="font-display text-4xl font-bold mb-2">The Glory of Rome</h2>
          <p className="text-muted-foreground">80 AD · 6 stops · Cinematic AR experience</p>
        </div>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, type, value, onChange, error, placeholder }: {
  icon: React.ElementType; label: string; type: string; value: string;
  onChange: (v: string) => void; error?: string; placeholder?: string;
}) => (
  <div>
    <label className="text-sm font-medium mb-1.5 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-12 pl-11 pr-4 rounded-xl bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth text-sm" />
    </div>
    {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
  </div>
);

export default Auth;

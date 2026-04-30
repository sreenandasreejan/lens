import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles, Trash2, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Moment {
  id: string;
  title: string;
  description: string | null;
  date: string;
  created_at: string;
}

const momentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  description: z.string().trim().max(2000, "Max 2000 characters").optional(),
  date: z.string().min(1, "Date is required"),
});

export const MomentsSection = ({ user }: { user: User }) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("moments")
      .select("id, title, description, date, created_at")
      .order("date", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load moments");
    } else {
      setMoments(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = momentSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await supabase.from("moments").insert({
      user_id: user.id,
      title: result.data.title,
      description: result.data.description || null,
      date: result.data.date,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Could not save moment");
      return;
    }
    toast.success("Moment saved ✨");
    setForm({ title: "", description: "", date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const handleDelete = async (id: string) => {
    const prev = moments;
    setMoments((m) => m.filter((x) => x.id !== id));
    const { error } = await supabase.from("moments").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Could not delete moment");
      setMoments(prev);
    } else {
      toast.success("Moment deleted");
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-display text-2xl font-bold">Your Moments</h2>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-gradient-card p-6 space-y-4 h-fit"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sunrise at the Colosseum"
              className="bg-input border-border"
            />
            {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What made this moment unforgettable?"
              rows={4}
              className="bg-input border-border resize-none"
            />
            {errors.description && <p className="text-xs text-destructive mt-1.5">{errors.description}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-input border-border pl-9"
              />
            </div>
            {errors.date && <p className="text-xs text-destructive mt-1.5">{errors.date}</p>}
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={saving}>
            <Plus className="!size-4" />
            {saving ? "Saving…" : "Save moment"}
          </Button>
        </form>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gradient-card border border-border/60 animate-pulse" />
            ))
          ) : moments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground text-sm">
              No moments yet. Capture your first one →
            </div>
          ) : (
            moments.map((m) => (
              <article
                key={m.id}
                className="group rounded-2xl border border-border/60 bg-gradient-card p-5 transition-smooth hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-lg truncate">{m.title}</h3>
                    </div>
                    <p className="text-xs text-primary mb-2 flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(m.date).toLocaleDateString(undefined, {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                    {m.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(m.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Delete moment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

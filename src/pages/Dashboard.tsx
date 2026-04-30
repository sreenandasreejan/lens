import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Map, Bookmark, User, LogOut, Star, Clock, MapPin, Check, Trophy, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchToursWithProgress,
  fetchRecentActivity,
  setTourCompletion,
  type TourWithProgress,
} from "@/services/tours";
import { supabase } from "@/integrations/supabase/client";
import { MomentsSection } from "@/components/MomentsSection";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Map, label: "Tours", id: "tours" },
  { icon: Bookmark, label: "Saved Locations", id: "saved" },
  { icon: User, label: "Profile", id: "profile" },
];

const PAGE_SIZE = 6;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [tours, setTours] = useState<TourWithProgress[]>([]);
  const [activity, setActivity] = useState<Array<{ id: string; last_visited_at: string; tours: { title: string; city: string; era: string } | null }>>([]);
  const [displayName, setDisplayName] = useState("Explorer");
  const [active, setActive] = useState("home");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [toursData, recent, profile] = await Promise.all([
          fetchToursWithProgress(user.id),
          fetchRecentActivity(user.id),
          supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        setTours(toursData);
        setActivity(recent as never);
        if (profile.data?.display_name) setDisplayName(profile.data.display_name);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("See you soon, traveler.");
    navigate("/");
  };

  const toggleComplete = async (tour: TourWithProgress) => {
    if (!user) return;
    const newCompleted = !tour.completed;
    setTours((prev) => prev.map((t) =>
      t.id === tour.id ? { ...t, completed: newCompleted, progress: newCompleted ? 100 : 0 } : t
    ));
    try {
      await setTourCompletion(user.id, tour.id, newCompleted);
      toast.success(newCompleted ? "Tour marked complete" : "Marked as incomplete");
    } catch (e) {
      console.error(e);
      toast.error("Could not update progress");
      setTours((prev) => prev.map((t) =>
        t.id === tour.id ? { ...t, completed: !newCompleted, progress: !newCompleted ? 100 : 0 } : t
      ));
    }
  };

  const filtered = tours.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const completedCount = tours.filter((t) => t.completed).length;
  const overallProgress = tours.length
    ? Math.round(tours.reduce((acc, t) => acc + (t.progress ?? 0), 0) / tours.length)
    : 0;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-6 sticky top-0 h-screen">
        <Logo />
        <nav className="mt-10 space-y-1.5 flex-1">
          {navItems.map(({ icon: Icon, label, id }) => (
            <button key={id} onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
                active === id ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive transition-smooth">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
              Hey {displayName.split(" ")[0]} <span className="text-gold">👋</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Signed in as <span className="text-foreground font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">View site →</Link>
            <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="md:hidden">
              <LogOut className="w-4 h-4" /> Log out
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Trophy} label="Tours completed" value={completedCount} suffix={`/ ${tours.length}`} />
          <StatCard icon={MapPin} label="Recent activity" value={activity.length} />
          <StatCard icon={Clock} label="Overall progress" value={`${overallProgress}%`}>
            <div className="h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </StatCard>
        </div>

        {user && <MomentsSection user={user} />}

        <section className="mb-12">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <h2 className="font-display text-2xl font-bold">Available tours</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tours or cities…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 h-10 bg-input border-border"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-gradient-card border border-border/60 animate-pulse" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border/60">
              No tours match your search.
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paged.map((t) => (
                  <TourCard key={t.id} tour={t} onToggle={() => toggleComplete(t)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
                  <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold mb-5">Recent activity</h2>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground text-sm">
              Start a tour to see it here.
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-gradient-card divide-y divide-border/40">
              {activity.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{l.tours?.title ?? "Tour"}</p>
                      <p className="text-xs text-muted-foreground">{l.tours?.city} · {l.tours?.era}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(l.last_visited_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, suffix, children }: {
  icon: React.ElementType; label: string; value: string | number; suffix?: string; children?: React.ReactNode;
}) => (
  <div className="p-6 rounded-2xl bg-gradient-card border border-border/60">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="font-display text-3xl font-bold mt-3">
      {value}{suffix && <span className="text-base text-muted-foreground font-normal ml-1">{suffix}</span>}
    </p>
    {children}
  </div>
);

const TourCard = ({ tour, onToggle }: { tour: TourWithProgress; onToggle: () => void }) => (
  <div className="group rounded-2xl border border-border/60 bg-gradient-card overflow-hidden transition-smooth hover:border-primary/50 hover:-translate-y-1 shadow-card">
    <div className="relative h-44 overflow-hidden">
      {tour.image_url && (
        <img src={tour.image_url} alt={tour.title} className="w-full h-full object-cover transition-smooth group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-background/80 backdrop-blur border border-border">
        {tour.era}
      </span>
      {tour.completed && (
        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-4 h-4" />
        </span>
      )}
    </div>
    <div className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{tour.city}</p>
        <span className="flex items-center gap-1 text-xs">
          <Star className="w-3 h-3 fill-primary text-primary" /> {tour.rating}
        </span>
      </div>
      <h3 className="font-display font-semibold text-lg mb-3 leading-tight">{tour.title}</h3>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tour.duration}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tour.stops} stops</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${tour.progress ?? 0}%` }} />
      </div>
      <Button onClick={onToggle} variant={tour.completed ? "outline" : "hero"} size="sm" className="w-full">
        {tour.completed ? "Mark as incomplete" : tour.progress ? "Continue tour" : "Start tour"}
      </Button>
    </div>
  </div>
);

export default Dashboard;

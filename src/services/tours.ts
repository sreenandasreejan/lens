import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tour = Database["public"]["Tables"]["tours"]["Row"];
export type TourProgress = Database["public"]["Tables"]["tour_progress"]["Row"];
export type TourWithProgress = Tour & { progress?: number; completed?: boolean };

/** Fetch tours and merge in the current user's progress (if signed in). */
export async function fetchToursWithProgress(userId?: string): Promise<TourWithProgress[]> {
  const { data: tours, error } = await supabase.from("tours").select("*").order("title");
  if (error) throw error;
  if (!userId) return tours ?? [];

  const { data: progress } = await supabase
    .from("tour_progress")
    .select("*")
    .eq("user_id", userId);

  const map = new Map((progress ?? []).map((p) => [p.tour_id, p]));
  return (tours ?? []).map((t) => ({
    ...t,
    progress: map.get(t.id)?.progress ?? 0,
    completed: map.get(t.id)?.completed ?? false,
  }));
}

export async function setTourCompletion(userId: string, tourId: string, completed: boolean) {
  const { error } = await supabase
    .from("tour_progress")
    .upsert(
      {
        user_id: userId,
        tour_id: tourId,
        completed,
        progress: completed ? 100 : 0,
        last_visited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tour_id" },
    );
  if (error) throw error;
}

export async function fetchRecentActivity(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from("tour_progress")
    .select("*, tours(*)")
    .eq("user_id", userId)
    .order("last_visited_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

import { supabase } from "@/supabase";

// ─── STORAGE (Supabase for logged-in users, localStorage fallback) ─────────
export const storage = {
  get: async (key: string): Promise<unknown> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("brands_data")
          .select("data")
          .eq("user_id", user.id)
          .single();
        if (!error && data) return (data as any).data;
      }
    } catch { /* fall through to localStorage */ }
    try {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  },

  set: async (key: string, value: unknown): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("brands_data")
          .upsert({ user_id: user.id, data: value, updated_at: new Date().toISOString() });
      }
    } catch { /* fall through to localStorage */ }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
  },
};

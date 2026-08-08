import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Public keep-alive / health endpoint.
 * Point an uptime monitor (e.g. cron-job.org, every 5-10 min) at
 * /api/public/health so the database never idles into sleep.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const { error } = await supabase.from("products").select("id", { head: true, count: "exact" }).limit(1);
          if (error) throw error;
          return Response.json({ ok: true, db: "awake", at: new Date().toISOString() });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "unavailable" }, { status: 503 });
        }
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: row, error } = await supabase
      .from("contact_submissions")
      .insert({ name: data.name, email: data.email, message: data.message })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Notify all admins via a SECURITY DEFINER RPC (no service role key needed).
    try {
      await supabase.rpc("notify_admins", {
        _title: `New contact message from ${data.name}`,
        _message: data.message.slice(0, 240),
      });
    } catch {
      /* non-fatal */
    }

    return { ok: true, id: row.id };
  });
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("contact_submissions")
      .insert({ name: data.name, email: data.email, message: data.message })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Notify all admins in-app so the admin dashboard/bell picks it up in realtime.
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          title: `New contact message from ${data.name}`,
          message: data.message.slice(0, 240),
        })),
      );
    }

    return { ok: true, id: row.id };
  });
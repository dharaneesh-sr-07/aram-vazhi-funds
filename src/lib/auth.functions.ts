import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { internalEmail, publicServerClient, validateStrongPassword, USERNAME_RE } from "./auth.server";

type LoginResult =
  | { ok: true; access_token: string; refresh_token: string; role: "admin" | "member"; mustChange: boolean }
  | { ok: false; reason: "invalid" | "inactive" | "not_admin" };

export const loginWithUsername = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ username: z.string().min(1).max(40), password: z.string().min(1).max(200), portal: z.enum(["admin", "member"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<LoginResult> => {
    if (!USERNAME_RE.test(data.username.trim())) return { ok: false, reason: "invalid" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin
      .from("members")
      .select("auth_user_id,status,must_change_password")
      .ilike("username", data.username.trim())
      .maybeSingle();
    if (!m?.auth_user_id) return { ok: false, reason: "invalid" };

    const client = publicServerClient();
    const { data: s, error } = await client.auth.signInWithPassword({
      email: internalEmail(data.username),
      password: data.password,
    });
    if (error || !s.session || s.user?.id !== m.auth_user_id) return { ok: false, reason: "invalid" };

    if (m.status !== "active") {
      await client.auth.signOut();
      return { ok: false, reason: "inactive" };
    }
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", m.auth_user_id);
    const role = roles?.some((r) => r.role === "admin") ? "admin" : "member";
    if (data.portal === "admin" && role !== "admin") {
      await client.auth.signOut();
      return { ok: false, reason: "not_admin" };
    }
    return {
      ok: true,
      access_token: s.session.access_token,
      refresh_token: s.session.refresh_token,
      role,
      mustChange: m.must_change_password,
    };
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const weak = validateStrongPassword(data.newPassword);
    if (weak) return { ok: false as const, error: weak };
    if (data.newPassword === data.currentPassword)
      return { ok: false as const, error: "புதிய கடவுச்சொல் பழையதிலிருந்து வேறுபட வேண்டும் (Must differ from current)" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("members").select("id,username,status").eq("auth_user_id", context.userId).maybeSingle();
    if (!m || m.status !== "active") return { ok: false as const, error: "கணக்கு செயலில் இல்லை (Account inactive)" };

    const check = await publicServerClient().auth.signInWithPassword({ email: internalEmail(m.username), password: data.currentPassword });
    if (check.error) return { ok: false as const, error: "தற்போதைய கடவுச்சொல் தவறு (Current password is wrong)" };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.newPassword });
    if (error) return { ok: false as const, error: "கடவுச்சொல்லை மாற்ற முடியவில்லை (Could not update password)" };
    await supabaseAdmin.from("members").update({ must_change_password: false, updated_at: new Date().toISOString() }).eq("id", m.id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId, action: "change_password", entity: "members", entity_id: m.id, details: {},
    });
    return { ok: true as const };
  });

// One-time setup: creates login accounts for the seeded member profiles using
// the AVK_INITIAL_PASSWORD secret. Refuses to run once any account is linked.
export const provisionInitialAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const pw = process.env["AVK_INITIAL_PASSWORD"];
  if (!pw || pw.length < 8) return { ok: false, error: "Initial password not configured" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("members").select("id", { count: "exact", head: true }).not("auth_user_id", "is", null);
  if ((count ?? 0) > 0) return { ok: false, error: "Already provisioned" };

  const admins = new Set(["dharaneesh", "sarath"]);
  const { data: members } = await supabaseAdmin.from("members").select("id,username,full_name,member_code").is("auth_user_id", null);
  const created: string[] = [];
  for (const m of members ?? []) {
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail(m.username), password: pw, email_confirm: true, user_metadata: { full_name: m.full_name },
    });
    if (error || !u.user) return { ok: false, error: `Failed for ${m.username}`, created };
    await supabaseAdmin.from("members").update({ auth_user_id: u.user.id, must_change_password: true }).eq("id", m.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: admins.has(m.username.toLowerCase()) ? "admin" : "member" });
    await supabaseAdmin.from("audit_logs").insert({
      actor_name: "System setup", action: "create_account", entity: "members", entity_id: m.id,
      details: { member_code: m.member_code, username: m.username, role: admins.has(m.username.toLowerCase()) ? "admin" : "member" },
    });
    created.push(m.username);
  }
  return { ok: true, created };
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { internalEmail, validateStrongPassword, USERNAME_RE } from "./auth.server";

async function assertAdmin(supabase: { rpc: (fn: "is_active_admin") => PromiseLike<{ data: unknown }> }) {
  const { data } = await supabase.rpc("is_active_admin");
  if (data !== true) throw new Error("அனுமதி இல்லை (Not allowed)");
}

const roleEnum = z.enum(["admin", "member"]);

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ fullName: z.string().trim().min(2).max(80), username: z.string().trim().max(30), role: roleEnum, tempPassword: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never);
    if (!USERNAME_RE.test(data.username)) return { ok: false as const, error: "பயனர்பெயர் சரியில்லை: எழுத்தில் தொடங்கி 3-30 எழுத்துகள் (Invalid username)" };
    if (data.tempPassword.length < 8) return { ok: false as const, error: "தற்காலிக கடவுச்சொல் குறைந்தது 8 எழுத்துகள் (Temp password ≥ 8 chars)" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exists } = await supabaseAdmin.from("members").select("id").ilike("username", data.username).maybeSingle();
    if (exists) return { ok: false as const, error: "இந்த பயனர்பெயர் ஏற்கனவே உள்ளது (Username already exists)" };

    const { data: code } = await supabaseAdmin.rpc("next_member_code");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail(data.username), password: data.tempPassword, email_confirm: true,
    });
    if (error || !u.user) return { ok: false as const, error: "கணக்கை உருவாக்க முடியவில்லை (Could not create account)" };
    const { data: m, error: e2 } = await supabaseAdmin.from("members")
      .insert({ auth_user_id: u.user.id, member_code: code as string, username: data.username, full_name: data.fullName, must_change_password: true })
      .select("id").single();
    if (e2 || !m) {
      await supabaseAdmin.auth.admin.deleteUser(u.user.id);
      return { ok: false as const, error: "சேமிக்க முடியவில்லை (Could not save member)" };
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: data.role });
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId, actor_name: await actorName(supabaseAdmin, context.userId),
      action: "create_member", entity: "members", entity_id: m.id,
      details: { member_code: code, username: data.username, full_name: data.fullName, role: data.role },
    });
    return { ok: true as const, memberCode: code as string };
  });

export const updateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ memberId: z.string().uuid(), fullName: z.string().trim().min(2).max(80), role: roleEnum, joinedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("members").select("id,auth_user_id,full_name,joined_on").eq("id", data.memberId).single();
    if (!m?.auth_user_id) return { ok: false as const, error: "Member not found" };
    if (m.auth_user_id === context.userId && data.role !== "admin")
      return { ok: false as const, error: "உங்கள் சொந்த நிர்வாகி உரிமையை நீக்க முடியாது (Cannot remove your own admin role)" };
    await supabaseAdmin.from("members").update({ full_name: data.fullName, ...(data.joinedOn !== undefined ? { joined_on: data.joinedOn } : {}), updated_at: new Date().toISOString() }).eq("id", m.id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", m.auth_user_id);
    await supabaseAdmin.from("user_roles").insert({ user_id: m.auth_user_id, role: data.role });
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId, actor_name: await actorName(supabaseAdmin, context.userId),
      action: "update_member", entity: "members", entity_id: m.id, details: { from: m.full_name, full_name: data.fullName, role: data.role, from_joined_on: m.joined_on, joined_on: data.joinedOn ?? m.joined_on },
    });
    return { ok: true as const };
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ memberId: z.string().uuid(), status: z.enum(["active", "inactive"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("members").select("id,auth_user_id").eq("id", data.memberId).single();
    if (!m) return { ok: false as const, error: "Member not found" };
    if (m.auth_user_id === context.userId) return { ok: false as const, error: "உங்கள் சொந்த கணக்கை முடக்க முடியாது (Cannot deactivate yourself)" };
    await supabaseAdmin.from("members").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", m.id);
    if (m.auth_user_id)
      await supabaseAdmin.auth.admin.updateUserById(m.auth_user_id, { ban_duration: data.status === "inactive" ? "876000h" : "none" });
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId, actor_name: await actorName(supabaseAdmin, context.userId),
      action: data.status === "inactive" ? "deactivate_member" : "reactivate_member", entity: "members", entity_id: m.id, details: {},
    });
    return { ok: true as const };
  });

export const resetMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ memberId: z.string().uuid(), tempPassword: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never);
    if (data.tempPassword.length < 8) return { ok: false as const, error: "குறைந்தது 8 எழுத்துகள் (At least 8 characters)" };
    void validateStrongPassword;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("members").select("id,auth_user_id").eq("id", data.memberId).single();
    if (!m?.auth_user_id) return { ok: false as const, error: "Member not found" };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(m.auth_user_id, { password: data.tempPassword });
    if (error) return { ok: false as const, error: "மாற்ற முடியவில்லை (Could not reset)" };
    await supabaseAdmin.from("members").update({ must_change_password: true, updated_at: new Date().toISOString() }).eq("id", m.id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId, actor_name: await actorName(supabaseAdmin, context.userId),
      action: "reset_password", entity: "members", entity_id: m.id, details: {},
    });
    return { ok: true as const };
  });

async function actorName(admin: { from: (t: "members") => any }, uid: string): Promise<string | null> {
  const { data } = await admin.from("members").select("full_name").eq("auth_user_id", uid).maybeSingle();
  return data?.full_name ?? null;
}

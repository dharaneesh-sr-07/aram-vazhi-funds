import { supabase } from "@/integrations/supabase/client";

export type Me = {
  userId: string;
  memberId: string;
  memberCode: string;
  username: string;
  fullName: string;
  status: "active" | "inactive";
  mustChange: boolean;
  role: "admin" | "member";
};

// Reads identity and role from trusted database rows (RLS-scoped to the user).
export async function getMe(): Promise<Me | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const [{ data: m }, { data: roles }] = await Promise.all([
    supabase.from("members").select("*").eq("auth_user_id", u.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", u.user.id),
  ]);
  if (!m) return null;
  return {
    userId: u.user.id,
    memberId: m.id,
    memberCode: m.member_code,
    username: m.username,
    fullName: m.full_name,
    status: m.status,
    mustChange: m.must_change_password,
    role: roles?.some((r) => r.role === "admin") ? "admin" : "member",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

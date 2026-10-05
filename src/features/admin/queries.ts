import "server-only";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function listCategoriesWithCounts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, kind, sort_order, products(count)")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data.map((c) => ({ id: c.id, name: c.name, kind: c.kind, productCount: c.products[0]?.count ?? 0 }));
}

export type TeamMember = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "designer";
  disabled: boolean;
  invitedPending: boolean;
  lastSignInAt: string | null;
};

/** Team members with their auth status. Needs the service role; callers must be admins. */
export async function listTeamMembers(): Promise<TeamMember[]> {
  const admin = createSupabaseAdminClient();
  const [{ data: profiles, error }, { data: authUsers, error: authError }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, role").order("full_name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (error) throw error;
  if (authError) throw authError;
  const authById = new Map(authUsers.users.map((u) => [u.id, u]));
  return profiles.map((p) => {
    const authUser = authById.get(p.id);
    const bannedUntil = authUser?.banned_until ? new Date(authUser.banned_until) : null;
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role,
      disabled: Boolean(bannedUntil && bannedUntil > new Date()),
      invitedPending: Boolean(authUser && !authUser.last_sign_in_at && authUser.invited_at),
      lastSignInAt: authUser?.last_sign_in_at ?? null,
    };
  });
}

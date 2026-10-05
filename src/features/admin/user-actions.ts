"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { fail, ok, validationFailure, type ActionResult, type FormState } from "@/lib/actions/result";
import { serverEnv } from "@/lib/env";
import { sv } from "@/lib/i18n/sv";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * User management uses the service role (Supabase restricts these APIs to it), so every action
 * first verifies that the caller is an admin.
 */
async function requireAdminCaller() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

const inviteSchema = z.object({
  email: z.email().max(254),
  full_name: z.string().trim().max(120).default(""),
  role: z.enum(["admin", "designer"]),
});

export async function inviteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await requireAdminCaller())) return fail(sv.common.notAllowed);
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email.toLowerCase(), {
    data: { full_name: parsed.data.full_name },
    redirectTo: `${serverEnv().NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  });
  if (error) {
    return fail(error.code === "email_exists" || error.status === 422 ? sv.admin.userExists : sv.common.unknownError);
  }
  // The profile row is created by a database trigger with the default role; set the chosen one.
  await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role: parsed.data.role } });
  await admin.from("profiles").update({ role: parsed.data.role }).eq("id", data.user.id);
  revalidatePath("/admin/users");
  return ok(undefined, sv.admin.invited);
}

async function activeAdminCount(admin: ReturnType<typeof createSupabaseAdminClient>, excludingId: string) {
  const { data } = await admin.from("profiles").select("id").eq("role", "admin").neq("id", excludingId);
  if (!data?.length) return 0;
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const now = new Date();
  return data.filter((p) => {
    const bannedUntil = users?.users.find((u) => u.id === p.id)?.banned_until;
    return !bannedUntil || new Date(bannedUntil) <= now;
  }).length;
}

export async function setUserRole(userId: string, role: "admin" | "designer"): Promise<ActionResult> {
  if (!(await requireAdminCaller())) return fail(sv.common.notAllowed);
  const id = z.uuid().parse(userId);
  const newRole = z.enum(["admin", "designer"]).parse(role);
  const admin = createSupabaseAdminClient();
  if (newRole === "designer" && (await activeAdminCount(admin, id)) === 0) return fail(sv.admin.lastAdmin);

  const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", id);
  if (error) return fail(sv.common.unknownError);
  await admin.auth.admin.updateUserById(id, { app_metadata: { role: newRole } });
  revalidatePath("/admin/users");
  return ok(undefined);
}

/** Disabling bans the account (it can no longer sign in) but keeps its work and history. */
export async function setUserDisabled(userId: string, disabled: boolean): Promise<ActionResult> {
  const caller = await requireAdminCaller();
  if (!caller) return fail(sv.common.notAllowed);
  const id = z.uuid().parse(userId);
  if (id === caller.id && disabled) return fail(sv.admin.cannotDisableSelf);
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin.from("profiles").select("role").eq("id", id).single();
  if (disabled && profile?.role === "admin" && (await activeAdminCount(admin, id)) === 0)
    return fail(sv.admin.lastAdmin);

  const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: disabled ? "876000h" : "none" });
  if (error) return fail(sv.common.unknownError);
  revalidatePath("/admin/users");
  return ok(undefined);
}

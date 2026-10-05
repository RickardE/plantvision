"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, validationFailure, type FormState } from "@/lib/actions/result";
import { serverEnv } from "@/lib/env";
import { sv } from "@/lib/i18n/sv";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(sv.auth.invalidCredentials);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return fail(sv.auth.invalidCredentials);

  redirect(safeNextPath(parsed.data.next));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: z.email() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createSupabaseServerClient();
  // Always report success so the form cannot be used to discover which addresses exist.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${serverEnv().NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  });
  return ok(undefined, sv.auth.resetLinkSent);
}

const passwordSchema = z.object({ password: z.string().min(8, sv.auth.setPasswordHint).max(72) });

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.code === "same_password" ? sv.auth.samePassword : sv.auth.linkInvalid);
  return ok(undefined, sv.auth.passwordUpdated);
}

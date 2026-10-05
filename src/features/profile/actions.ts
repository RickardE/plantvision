"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, validationFailure, type FormState } from "@/lib/actions/result";
import { sv } from "@/lib/i18n/sv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return fail(sv.common.notAllowed);
  const parsed = z.object({ full_name: z.string().trim().min(1).max(120) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return fail(sv.common.unknownError);
  revalidatePath("/profile");
  return ok(undefined, sv.common.saved);
}

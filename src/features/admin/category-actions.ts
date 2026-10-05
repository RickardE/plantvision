"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { fail, ok, PG, validationFailure, type ActionResult } from "@/lib/actions/result";
import { sv } from "@/lib/i18n/sv";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["plant", "pot", "accessory", "other"]),
});

async function adminClient() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? createSupabaseServerClient() : null;
}

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function createCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const base = slugify(parsed.data.name);
  let slug = base;
  for (let attempt = 2; attempt < 20; attempt++) {
    const { error } = await supabase
      .from("categories")
      .insert({ ...parsed.data, slug, sort_order: (last?.[0]?.sort_order ?? 0) + 10 });
    if (!error) {
      revalidate();
      return ok(undefined);
    }
    if (error.code !== PG.uniqueViolation) return fail(sv.common.unknownError);
    slug = `${base}-${attempt}`;
  }
  return fail(sv.common.unknownError);
}

export async function updateCategory(id: string, input: z.input<typeof categorySchema>): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { error } = await supabase.from("categories").update(parsed.data).eq("id", z.uuid().parse(id));
  if (error) return fail(sv.common.unknownError);
  revalidate();
  return ok(undefined);
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const { data: all, error } = await supabase
    .from("categories")
    .select("id, sort_order")
    .order("sort_order")
    .order("name");
  if (error) return fail(sv.common.unknownError);
  const index = all.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= all.length) return ok(undefined);

  const ordered = [...all];
  [ordered[index], ordered[swapWith]] = [ordered[swapWith]!, ordered[index]!];
  const results = await Promise.all(
    ordered.map((c, i) =>
      supabase
        .from("categories")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", c.id),
    ),
  );
  if (results.some((r) => r.error)) return fail(sv.common.unknownError);
  revalidate();
  return ok(undefined);
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const { error } = await supabase.from("categories").delete().eq("id", z.uuid().parse(id));
  if (error) return fail(error.code === PG.foreignKeyViolation ? sv.admin.categoryInUse : sv.common.unknownError);
  revalidate();
  return ok(undefined);
}

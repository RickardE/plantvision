"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { fail, ok, validationFailure, type ActionResult, type FormState } from "@/lib/actions/result";
import { clampPlacement } from "@/lib/images/placement";
import { sv } from "@/lib/i18n/sv";
import { ENVIRONMENT_BUCKET, thumbnailPath, VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function userClient() {
  return (await getCurrentUser()) ? createSupabaseServerClient() : null;
}

const id = z.uuid();

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const projectSchema = z.object({
  name: z.string().trim().min(1, sv.validation.nameRequired).max(160),
  customer_name: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => v || null),
});

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase.from("projects").insert(parsed.data).select("id").single();
  if (error) return fail(sv.common.unknownError);
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(projectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id.parse(projectId));
  if (error) return fail(sv.common.unknownError);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return ok(undefined, sv.common.saved);
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const pid = id.parse(projectId);

  const { data: designs } = await supabase.from("designs").select("id").eq("project_id", pid);
  const { error } = await supabase.from("projects").delete().eq("id", pid);
  if (error) return fail(sv.common.unknownError);
  await Promise.all((designs ?? []).map((d) => removeDesignMedia(supabase, d.id)));
  revalidatePath("/projects");
  redirect("/projects");
}

// ---------------------------------------------------------------------------
// Designs ("rooms")
// ---------------------------------------------------------------------------

const nameSchema = z.object({ name: z.string().trim().min(1, sv.validation.nameRequired).max(160) });

export async function createDesign(projectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { data, error } = await supabase
    .from("designs")
    .insert({ project_id: id.parse(projectId), name: parsed.data.name })
    .select("id")
    .single();
  if (error) return fail(sv.common.unknownError);
  await supabase
    .from("design_alternatives")
    .insert({ design_id: data.id, name: sv.designs.alternativeName(1), position: 1 });
  revalidatePath(`/projects/${projectId}`);
  redirect(`/designs/${data.id}`);
}

export async function renameDesign(designId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { data, error } = await supabase
    .from("designs")
    .update({ name: parsed.data.name })
    .eq("id", id.parse(designId))
    .select("project_id")
    .single();
  if (error) return fail(sv.common.unknownError);
  revalidatePath(`/designs/${designId}`);
  revalidatePath(`/projects/${data.project_id}`);
  return ok(undefined, sv.common.saved);
}

export async function deleteDesign(designId: string): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const did = id.parse(designId);
  const { data, error } = await supabase.from("designs").delete().eq("id", did).select("project_id").single();
  if (error) return fail(sv.common.unknownError);
  await removeDesignMedia(supabase, did);
  revalidatePath(`/projects/${data.project_id}`);
  redirect(`/projects/${data.project_id}`);
}

/** Storage objects are not deleted by database cascades; remove a design's folder in each bucket. */
async function removeDesignMedia(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, designId: string) {
  for (const bucket of [ENVIRONMENT_BUCKET, VISUALIZATION_BUCKET]) {
    const paths = await listFolderRecursive(supabase, bucket, designId);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
}

async function listFolderRecursive(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bucket: string,
  folder: string,
): Promise<string[]> {
  const { data } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  const paths: string[] = [];
  for (const entry of data ?? []) {
    const path = `${folder}/${entry.name}`;
    // Folders have no id in the storage listing.
    if (entry.id) paths.push(path);
    else paths.push(...(await listFolderRecursive(supabase, bucket, path)));
  }
  return paths;
}

const imageSchema = z.object({
  path: z.string(),
  width: z.number().int().min(16).max(10000),
  height: z.number().int().min(16).max(10000),
});

/**
 * Registers a room photo the browser has uploaded (full size + thumbnail) to
 * `environment-images/<designId>/<file>.jpg`. Earlier photos are kept because existing
 * visualizations still show them as their "before" image.
 */
export async function setDesignImage(designId: string, input: z.input<typeof imageSchema>): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const did = id.parse(designId);
  const parsed = imageSchema
    .refine((v) => new RegExp(`^${did}/[A-Za-z0-9_-]+\\.jpg$`).test(v.path) && !v.path.includes("/thumb-"))
    .safeParse(input);
  if (!parsed.success) return fail(sv.common.invalidInput);

  const { data: files } = await supabase.storage.from(ENVIRONMENT_BUCKET).list(did, {
    search: parsed.data.path.slice(did.length + 1),
  });
  if (!files?.length) return fail(sv.common.invalidInput);

  const { error } = await supabase
    .from("designs")
    .update({
      environment_image_path: parsed.data.path,
      image_width: parsed.data.width,
      image_height: parsed.data.height,
    })
    .eq("id", did);
  if (error) return fail(sv.common.unknownError);
  revalidatePath(`/designs/${did}`);
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------------

export async function createAlternative(
  designId: string,
  copyFromAlternativeId: string | null,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const did = id.parse(designId);

  const { data: existing } = await supabase.from("design_alternatives").select("position").eq("design_id", did);
  const nextNumber = (existing?.length ?? 0) + 1;
  const name = sv.designs.alternativeName(nextNumber);

  if (copyFromAlternativeId) {
    const { data, error } = await supabase.rpc("duplicate_alternative", {
      p_alternative_id: id.parse(copyFromAlternativeId),
      p_name: name,
    });
    if (error) return fail(sv.common.unknownError);
    revalidatePath(`/designs/${did}`);
    return ok({ id: data });
  }

  const position = Math.max(0, ...(existing ?? []).map((a) => a.position)) + 1;
  const { data, error } = await supabase
    .from("design_alternatives")
    .insert({ design_id: did, name, position })
    .select("id")
    .single();
  if (error) return fail(sv.common.unknownError);
  revalidatePath(`/designs/${did}`);
  return ok({ id: data.id });
}

export async function renameAlternative(alternativeId: string, name: string): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = z.string().trim().min(1).max(80).safeParse(name);
  if (!parsed.success) return fail(sv.common.invalidInput);
  const { data, error } = await supabase
    .from("design_alternatives")
    .update({ name: parsed.data })
    .eq("id", id.parse(alternativeId))
    .select("design_id")
    .single();
  if (error) return fail(sv.common.unknownError);
  revalidatePath(`/designs/${data.design_id}`);
  return ok(undefined);
}

export async function deleteAlternative(alternativeId: string): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const aid = id.parse(alternativeId);
  const { data: alternative } = await supabase.from("design_alternatives").select("design_id").eq("id", aid).single();
  if (!alternative) return fail(sv.common.unknownError);

  const { count } = await supabase
    .from("design_alternatives")
    .select("id", { count: "exact", head: true })
    .eq("design_id", alternative.design_id);
  if ((count ?? 0) <= 1) return fail(sv.designs.lastAlternative);

  const { data: visualizations } = await supabase
    .from("visualizations")
    .select("composite_path, result_path")
    .eq("alternative_id", aid);
  const { error } = await supabase.from("design_alternatives").delete().eq("id", aid);
  if (error) return fail(sv.common.unknownError);

  const paths = (visualizations ?? []).flatMap((v) =>
    [v.composite_path, v.result_path, v.result_path && thumbnailPath(v.result_path)].filter((p): p is string =>
      Boolean(p),
    ),
  );
  if (paths.length) await supabase.storage.from(VISUALIZATION_BUCKET).remove(paths);
  revalidatePath(`/designs/${alternative.design_id}`);
  return ok(undefined);
}

const itemSchema = z.object({
  productId: z.uuid(),
  productImageId: z.uuid().nullable(),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  rotation: z.number().finite(),
  flipX: z.boolean(),
});

export type SaveItemInput = z.input<typeof itemSchema>;

/** Replaces all items of an alternative atomically (editor autosave). Order = stacking order. */
export async function saveAlternativeItems(alternativeId: string, items: SaveItemInput[]): Promise<ActionResult> {
  const supabase = await userClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = z.array(itemSchema).max(200).safeParse(items);
  if (!parsed.success) return fail(sv.common.invalidInput);

  const payload = parsed.data.map((item) => {
    const p = clampPlacement(item);
    return {
      product_id: item.productId,
      product_image_id: item.productImageId,
      x: p.x,
      y: p.y,
      width: p.width,
      rotation: p.rotation,
      flip_x: p.flipX,
    };
  });
  const { error } = await supabase.rpc("save_alternative_items", {
    p_alternative_id: id.parse(alternativeId),
    p_items: payload,
  });
  if (error) return fail(sv.common.unknownError);
  return ok(undefined);
}

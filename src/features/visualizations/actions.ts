"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { sv } from "@/lib/i18n/sv";
import { thumbnailPath, VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runVisualizationJob } from "./job";
import { STALE_PENDING_MS } from "./status";

/** Guards against accidental repeat submissions running up AI costs. */
const MAX_PENDING_PER_ALTERNATIVE = 3;

const generateSchema = z.object({
  alternativeId: z.uuid(),
  instructions: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
});

/**
 * Starts an AI visualization of an alternative. Returns immediately with the new id; generation
 * continues in the background and the UI polls until the status changes.
 */
export async function generateVisualization(
  input: z.input<typeof generateSchema>,
): Promise<ActionResult<{ id: string }>> {
  if (!(await getCurrentUser())) return fail(sv.common.notAllowed);
  const parsed = generateSchema.safeParse(input);
  if (!parsed.success) return fail(sv.common.invalidInput);

  // Read through the user's client so RLS decides whether they may use this alternative.
  const supabase = await createSupabaseServerClient();
  const { data: alternative } = await supabase
    .from("design_alternatives")
    .select("id, design:designs(id, environment_image_path), items:design_items(count)")
    .eq("id", parsed.data.alternativeId)
    .maybeSingle();
  if (!alternative?.design) return fail(sv.common.notAllowed);
  if (!alternative.design.environment_image_path) return fail(sv.editor.needsImage);
  if ((alternative.items[0]?.count ?? 0) === 0) return fail(sv.editor.generateEmpty);

  const { count: pending } = await supabase
    .from("visualizations")
    .select("id", { count: "exact", head: true })
    .eq("alternative_id", alternative.id)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - STALE_PENDING_MS).toISOString());
  if ((pending ?? 0) >= MAX_PENDING_PER_ALTERNATIVE) return fail(sv.visualizations.tooManyPending);

  const { data: visualization, error } = await supabase
    .from("visualizations")
    .insert({
      alternative_id: alternative.id,
      instructions: parsed.data.instructions,
      environment_image_path: alternative.design.environment_image_path,
    })
    .select("id")
    .single();
  if (error) return fail(sv.common.unknownError);

  after(() => runVisualizationJob(visualization.id));
  revalidatePath(`/designs/${alternative.design.id}`);
  return ok({ id: visualization.id });
}

export async function deleteVisualization(visualizationId: string): Promise<ActionResult<{ designId: string }>> {
  if (!(await getCurrentUser())) return fail(sv.common.notAllowed);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visualizations")
    .delete()
    .eq("id", z.uuid().parse(visualizationId))
    .select("composite_path, result_path, alternative:design_alternatives(design_id)")
    .single();
  if (error) return fail(sv.common.unknownError);

  const paths = [data.composite_path, data.result_path, data.result_path && thumbnailPath(data.result_path)].filter(
    (p): p is string => Boolean(p),
  );
  if (paths.length) await supabase.storage.from(VISUALIZATION_BUCKET).remove(paths);
  const designId = data.alternative!.design_id;
  revalidatePath(`/designs/${designId}`);
  return ok({ designId });
}

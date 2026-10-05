import "server-only";
import { ENVIRONMENT_BUCKET, signPaths, VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { effectiveStatus } from "./status";

export async function getVisualization(visualizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: v, error } = await supabase
    .from("visualizations")
    .select(
      `id, status, instructions, result_path, environment_image_path, error, created_at, completed_at, provider, model,
       alternative:design_alternatives(id, name, design:designs(id, name, image_width, image_height, project:projects(id, name)))`,
    )
    .eq("id", visualizationId)
    .maybeSingle();
  if (error) throw error;
  if (!v) return null;

  const [before, after] = await Promise.all([
    signPaths(supabase, ENVIRONMENT_BUCKET, [v.environment_image_path]),
    signPaths(supabase, VISUALIZATION_BUCKET, [v.result_path]),
  ]);

  return {
    id: v.id,
    status: effectiveStatus(v),
    instructions: v.instructions,
    error: v.error,
    createdAt: v.created_at,
    beforeUrl: before.get(v.environment_image_path),
    afterUrl: v.result_path ? after.get(v.result_path) : undefined,
    alternative: { id: v.alternative!.id, name: v.alternative!.name },
    design: {
      id: v.alternative!.design!.id,
      name: v.alternative!.design!.name,
      width: v.alternative!.design!.image_width,
      height: v.alternative!.design!.image_height,
    },
    project: v.alternative!.design!.project!,
  };
}

export type VisualizationDetail = NonNullable<Awaited<ReturnType<typeof getVisualization>>>;

/** Succeeded visualizations of a design with full-size URLs, for side-by-side comparison. */
export async function getComparableVisualizations(designId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visualizations")
    .select("id, result_path, created_at, instructions, alternative:design_alternatives!inner(id, name, design_id)")
    .eq("alternative.design_id", designId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const urls = await signPaths(
    supabase,
    VISUALIZATION_BUCKET,
    data.map((v) => v.result_path),
  );
  return data.map((v) => ({
    id: v.id,
    url: urls.get(v.result_path!),
    createdAt: v.created_at,
    instructions: v.instructions,
    alternativeName: v.alternative.name,
  }));
}

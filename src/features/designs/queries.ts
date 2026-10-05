import "server-only";
import { cache } from "react";
import { primaryImage } from "@/features/products/images";
import { ENVIRONMENT_BUCKET, signPaths, thumbnailPath, VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { effectiveStatus } from "@/features/visualizations/status";

export async function listProjects() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_summaries")
    .select("id, name, customer_name, updated_at, room_count, visualization_count, cover_image_path")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const thumbs = await signPaths(
    supabase,
    ENVIRONMENT_BUCKET,
    data.map((p) => p.cover_image_path && thumbnailPath(p.cover_image_path)),
  );
  return data.map((p) => ({
    id: p.id!,
    name: p.name!,
    customerName: p.customer_name,
    updatedAt: p.updated_at!,
    roomCount: Number(p.room_count ?? 0),
    visualizationCount: Number(p.visualization_count ?? 0),
    coverUrl: p.cover_image_path ? thumbs.get(thumbnailPath(p.cover_image_path)) : undefined,
  }));
}

/** Cached per request: the page and its metadata share one lookup. */
export const getProject = cache(async (projectId: string) => {
  const supabase = await createSupabaseServerClient();
  const [{ data: project, error }, { data: designs, error: designsError }] = await Promise.all([
    supabase.from("projects").select("id, name, customer_name").eq("id", projectId).maybeSingle(),
    supabase
      .from("design_summaries")
      .select("id, name, environment_image_path, visualization_count, updated_at")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);
  if (error) throw error;
  if (designsError) throw designsError;
  if (!project) return null;

  const thumbs = await signPaths(
    supabase,
    ENVIRONMENT_BUCKET,
    designs.map((d) => d.environment_image_path && thumbnailPath(d.environment_image_path)),
  );
  return {
    ...project,
    designs: designs.map((d) => ({
      id: d.id!,
      name: d.name!,
      hasImage: Boolean(d.environment_image_path),
      visualizationCount: Number(d.visualization_count ?? 0),
      thumbnailUrl: d.environment_image_path ? thumbs.get(thumbnailPath(d.environment_image_path)) : undefined,
    })),
  };
});

/** Cached per request: the page and its metadata share one lookup. */
export const getDesign = cache(async (designId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: design, error } = await supabase
    .from("designs")
    .select(
      `id, name, environment_image_path, image_width, image_height,
       project:projects(id, name),
       alternatives:design_alternatives(id, name, position, updated_at, items:design_items(count),
         visualizations(id, status, result_path, instructions, created_at))`,
    )
    .eq("id", designId)
    .order("position", { referencedTable: "design_alternatives" })
    .maybeSingle();
  if (error) throw error;
  if (!design) return null;

  const visualizations = design.alternatives
    .flatMap((a) =>
      a.visualizations.map((v) => ({ ...v, status: effectiveStatus(v), alternativeId: a.id, alternativeName: a.name })),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const [environmentUrls, resultThumbs] = await Promise.all([
    signPaths(supabase, ENVIRONMENT_BUCKET, [design.environment_image_path]),
    signPaths(
      supabase,
      VISUALIZATION_BUCKET,
      visualizations.map((v) => v.result_path && thumbnailPath(v.result_path)),
    ),
  ]);

  return {
    id: design.id,
    name: design.name,
    project: design.project!,
    image:
      design.environment_image_path && design.image_width && design.image_height
        ? {
            url: environmentUrls.get(design.environment_image_path),
            width: design.image_width,
            height: design.image_height,
          }
        : null,
    alternatives: design.alternatives.map((a) => ({
      id: a.id,
      name: a.name,
      itemCount: a.items[0]?.count ?? 0,
      visualizationCount: a.visualizations.filter((v) => v.status === "succeeded").length,
    })),
    visualizations: visualizations.map((v) => ({
      id: v.id,
      status: v.status,
      alternativeId: v.alternativeId,
      alternativeName: v.alternativeName,
      instructions: v.instructions,
      createdAt: v.created_at,
      thumbnailUrl: v.result_path ? resultThumbs.get(thumbnailPath(v.result_path)) : undefined,
    })),
  };
});

export type DesignDetail = NonNullable<Awaited<ReturnType<typeof getDesign>>>;

/** Everything the editor needs for one alternative. */
export async function getEditorData(designId: string, alternativeId: string | undefined) {
  const design = await getDesign(designId);
  if (!design) return null;
  const alternative = design.alternatives.find((a) => a.id === alternativeId) ?? design.alternatives[0];
  if (!alternative) return { design, alternative: null, items: [] };

  const supabase = await createSupabaseServerClient();
  const { data: items, error } = await supabase
    .from("design_items")
    .select(
      `id, x, y, width, rotation, flip_x, z_index, product_image_id,
       product:products(id, name, width_cm, height_cm, category:categories(kind),
         images:product_images(id, storage_path, external_url, position))`,
    )
    .eq("alternative_id", alternative.id)
    .order("z_index");
  if (error) throw error;

  return {
    design,
    alternative,
    items: items.map((item) => {
      const image =
        item.product!.images.find((i) => i.id === item.product_image_id) ?? primaryImage(item.product!.images);
      return {
        id: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        rotation: item.rotation,
        flipX: item.flip_x,
        product: {
          id: item.product!.id,
          name: item.product!.name,
          kind: item.product!.category?.kind ?? null,
          imageId: image?.id ?? null,
        },
      };
    }),
  };
}

import "server-only";
import { loadProductCutout } from "@/features/products/cutout";
import { primaryImage } from "@/features/products/images";
import { getImageProvider } from "@/lib/ai";
import { ImageGenerationError } from "@/lib/ai/types";
import { composeDesign, toJpegWithThumbnail } from "@/lib/images/server";
import { ENVIRONMENT_BUCKET, thumbnailPath, VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildVisualizationPrompt, type PromptItem } from "./prompt";

const RETRY_DELAY_MS = 3000;

/**
 * Generates one visualization. Runs after the Server Action has responded (see `after()` in
 * actions.ts) with the service role, because there is no user request left to act on behalf of.
 * The action has already checked the user's access to the alternative.
 */
export async function runVisualizationJob(visualizationId: string) {
  const supabase = createSupabaseAdminClient();
  try {
    await generate(supabase, visualizationId);
  } catch (error) {
    console.error("Visualization failed", visualizationId, error);
    await supabase
      .from("visualizations")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", visualizationId);
  }
}

async function generate(supabase: ReturnType<typeof createSupabaseAdminClient>, visualizationId: string) {
  const { data: viz, error } = await supabase
    .from("visualizations")
    .select(
      `id, instructions, environment_image_path,
       alternative:design_alternatives(id, design:designs(id, image_width, image_height),
         items:design_items(x, y, width, rotation, flip_x, z_index, product_image_id,
           product:products(id, name, width_cm, height_cm, category:categories(kind),
             images:product_images(id, storage_path, external_url, position))))`,
    )
    .eq("id", visualizationId)
    .single();
  if (error) throw error;

  const design = viz.alternative!.design!;
  const items = [...viz.alternative!.items].sort((a, b) => a.z_index - b.z_index);
  if (items.length === 0) throw new Error("The alternative has no products");

  const { data: roomBlob, error: roomError } = await supabase.storage
    .from(ENVIRONMENT_BUCKET)
    .download(viz.environment_image_path);
  if (roomError) throw roomError;
  const room = Buffer.from(await roomBlob.arrayBuffer());

  // One cut-out per distinct product image; the same product may be placed several times.
  const referenceIndexByImage = new Map<string, number>();
  const references: { name: string; png: Buffer }[] = [];
  const layers = [];
  const promptItems: PromptItem[] = [];

  for (const item of items) {
    const product = item.product!;
    const image = product.images.find((i) => i.id === item.product_image_id) ?? primaryImage(product.images);
    if (!image) throw new Error(`Product "${product.name}" has no image`);
    const cutout = await loadProductCutout(image);

    let referenceIndex = referenceIndexByImage.get(image.id);
    if (referenceIndex === undefined) {
      referenceIndex = references.length;
      referenceIndexByImage.set(image.id, referenceIndex);
      references.push({ name: product.name, png: cutout.png });
    }

    const placement = { x: item.x, y: item.y, width: item.width, rotation: item.rotation, flipX: item.flip_x };
    const aspect = cutout.width / cutout.height;
    layers.push({ ...placement, png: cutout.png, aspect });
    promptItems.push({
      ...placement,
      aspect,
      productName: product.name,
      kind: product.category?.kind ?? "other",
      widthCm: product.width_cm,
      heightCm: product.height_cm,
      referenceIndex,
    });
  }

  const composite = await composeDesign(room, layers);
  const prompt = buildVisualizationPrompt({
    items: promptItems,
    image: { width: composite.width, height: composite.height },
    instructions: viz.instructions,
  });

  const folder = `${design.id}/${viz.id}`;
  const compositePath = `${folder}/composite.jpg`;
  await upload(supabase, compositePath, composite.jpeg);
  await supabase.from("visualizations").update({ composite_path: compositePath, prompt }).eq("id", viz.id);

  const provider = getImageProvider();
  const result = await withOneRetry(() =>
    provider.generate({
      prompt,
      roomImage: { data: room, mimeType: "image/jpeg", label: "Image 1 (original room):" },
      compositeImage: { data: composite.jpeg, mimeType: "image/jpeg", label: "Image 2 (designer's composition):" },
      productImages: references.map((r, i) => ({
        data: r.png,
        mimeType: "image/png",
        label: `Image ${i + 3} (reference: ${r.name}):`,
      })),
      aspectRatio: composite.width / composite.height,
    }),
  );

  const normalized = await toJpegWithThumbnail(result.data);
  const resultPath = `${folder}/result.jpg`;
  await upload(supabase, resultPath, normalized.full);
  await upload(supabase, thumbnailPath(resultPath), normalized.thumb);

  const { error: updateError } = await supabase
    .from("visualizations")
    .update({
      status: "succeeded",
      result_path: resultPath,
      provider: provider.name,
      model: provider.model,
      error: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", viz.id);
  if (updateError) throw updateError;
}

/** Rate limits and provider hiccups (retryable errors) get one more attempt after a short pause. */
async function withOneRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof ImageGenerationError) || !error.retryable) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return run();
  }
}

async function upload(supabase: ReturnType<typeof createSupabaseAdminClient>, path: string, data: Buffer) {
  const { error } = await supabase.storage
    .from(VISUALIZATION_BUCKET)
    .upload(path, data, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
  if (error) throw error;
}

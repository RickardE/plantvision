import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ParsedProduct } from "./supplier-csv";

// Keeps the `in (...)` filters comfortably below URL length limits.
const CHUNK_SIZE = 100;

export type ImportOutcome = { created: number; updated: number; imagesAdded: number };

/**
 * Upserts parsed supplier products on article number.
 *
 * Only supplier-owned fields are written, so values an admin maintains in PlantVision
 * (status, light requirement, botanical name, description, own images) survive re-imports.
 * Supplier images are added if the product does not already have that URL.
 */
export async function importProducts(
  supabase: SupabaseClient<Database>,
  products: ParsedProduct[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportOutcome> {
  const { data: categories, error: categoryError } = await supabase.from("categories").select("id, slug");
  if (categoryError) throw categoryError;
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const outcome: ImportOutcome = { created: 0, updated: 0, imagesAdded: 0 };

  for (let start = 0; start < products.length; start += CHUNK_SIZE) {
    const chunk = products.slice(start, start + CHUNK_SIZE);
    const articleNumbers = chunk.map((p) => p.article_number);

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("article_number")
      .in("article_number", articleNumbers);
    if (existingError) throw existingError;
    const existingSet = new Set(existing.map((e) => e.article_number));

    const rows = chunk.map((p) => {
      const categoryId = categoryIdBySlug.get(p.category_slug);
      if (!categoryId) throw new Error(`Unknown category slug: ${p.category_slug}`);
      return {
        article_number: p.article_number,
        name: p.name,
        category_id: categoryId,
        supplier: p.supplier,
        width_cm: p.width_cm,
        depth_cm: p.depth_cm,
        height_cm: p.height_cm,
        size_label: p.size_label,
        color: p.color,
        price_sek: p.price_sek,
        metadata: p.metadata,
      };
    });

    const { data: upserted, error: upsertError } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "article_number" })
      .select("id, article_number");
    if (upsertError) throw upsertError;

    outcome.created += chunk.length - existingSet.size;
    outcome.updated += existingSet.size;
    outcome.imagesAdded += await addMissingImages(supabase, chunk, upserted);
    onProgress?.(Math.min(start + CHUNK_SIZE, products.length), products.length);
  }

  return outcome;
}

async function addMissingImages(
  supabase: SupabaseClient<Database>,
  chunk: ParsedProduct[],
  upserted: { id: string; article_number: string }[],
) {
  const idByArticle = new Map(upserted.map((u) => [u.article_number, u.id]));
  const withImages = chunk.filter((p) => p.image_url && idByArticle.has(p.article_number));
  if (withImages.length === 0) return 0;

  const productIds = withImages.map((p) => idByArticle.get(p.article_number)!);
  const { data: images, error } = await supabase
    .from("product_images")
    .select("product_id, external_url, position")
    .in("product_id", productIds);
  if (error) throw error;

  const byProduct = new Map<string, { urls: Set<string>; maxPosition: number }>();
  for (const image of images) {
    const entry = byProduct.get(image.product_id) ?? { urls: new Set<string>(), maxPosition: -1 };
    if (image.external_url) entry.urls.add(image.external_url);
    entry.maxPosition = Math.max(entry.maxPosition, image.position);
    byProduct.set(image.product_id, entry);
  }

  const inserts = withImages.flatMap((p) => {
    const productId = idByArticle.get(p.article_number)!;
    const entry = byProduct.get(productId);
    if (entry?.urls.has(p.image_url!)) return [];
    return [{ product_id: productId, external_url: p.image_url!, position: (entry?.maxPosition ?? -1) + 1 }];
  });
  if (inserts.length === 0) return 0;

  const { error: insertError } = await supabase.from("product_images").insert(inserts);
  if (insertError) throw insertError;
  return inserts.length;
}

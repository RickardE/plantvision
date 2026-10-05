/**
 * Adds a few illustrated demo products (with images in Storage) to a local database.
 *
 *   pnpm seed:demo
 *
 * Safe to re-run. Intended for local development and end-to-end tests only.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { DEMO_PRODUCTS, renderDemoImage, renderDemoRoom } from "./demo-images";

config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required");
  if (!/127\.0\.0\.1|localhost/.test(url) && process.env.ALLOW_REMOTE_SEED !== "1") {
    throw new Error("Refusing to seed a non-local database (set ALLOW_REMOTE_SEED=1 to override)");
  }
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

  const { data: categories, error } = await supabase.from("categories").select("id, slug");
  if (error) throw error;

  for (const product of DEMO_PRODUCTS) {
    const categoryId = categories.find((c) => c.slug === product.category)?.id;
    if (!categoryId) throw new Error(`Missing category ${product.category}`);
    const { data: row, error: upsertError } = await supabase
      .from("products")
      .upsert(
        {
          article_number: product.article,
          name: product.name,
          botanical_name: product.botanical,
          category_id: categoryId,
          width_cm: product.w,
          height_cm: product.h,
          light_requirement: product.light,
          supplier: "Demo",
          status: "active",
        },
        { onConflict: "article_number" },
      )
      .select("id")
      .single();
    if (upsertError) throw upsertError;

    const path = `${row.id}/demo.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, await renderDemoImage(product.svg()), { contentType: "image/jpeg", upsert: true });
    if (uploadError) throw uploadError;
    const { data: existing } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", row.id)
      .eq("storage_path", path);
    if (!existing?.length) {
      await supabase.from("product_images").insert({ product_id: row.id, storage_path: path, position: 0 });
    }
    console.log(`✓ ${product.name}`);
  }

  mkdirSync("tests/fixtures", { recursive: true });
  writeFileSync("tests/fixtures/room.jpg", await renderDemoRoom());
  writeFileSync("tests/fixtures/plant.jpg", await renderDemoImage(DEMO_PRODUCTS[0].svg()));
  console.log("✓ wrote tests/fixtures/room.jpg and plant.jpg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

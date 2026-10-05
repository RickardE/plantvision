"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { prepareImageForUpload } from "@/lib/images/prepare-upload";
import { addProductImages } from "./actions";
import { PRODUCT_IMAGE_BUCKET } from "./images";

/**
 * Uploads product photos straight from the browser to Supabase Storage (so large files never
 * pass through a Server Action), then registers them on the product.
 */
export async function uploadProductImages(productId: string, files: File[]) {
  const supabase = getSupabaseBrowserClient();
  const paths: string[] = [];
  for (const file of files) {
    const prepared = await prepareImageForUpload(file, { maxDimension: 1600, keepTransparency: true });
    const path = `${productId}/${crypto.randomUUID()}.${prepared.extension}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, prepared.blob, {
      contentType: prepared.extension === "png" ? "image/png" : "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  if (paths.length === 0) return;
  const result = await addProductImages(productId, paths);
  if (!result.ok) throw new Error(result.error);
}

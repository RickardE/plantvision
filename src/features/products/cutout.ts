import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchRemoteImage, makeCutout } from "@/lib/images/server";
import { PRODUCT_IMAGE_BUCKET, type ProductImageRef } from "./images";

type Cutout = Awaited<ReturnType<typeof makeCutout>>;

// Product images never change for a given id (replacing an image creates a new row), so a small
// per-instance cache is always valid and saves repeated downloads while a designer is working.
const cache = new Map<string, Promise<Cutout>>();
const CACHE_LIMIT = 200;

export function loadProductCutout(
  image: Pick<ProductImageRef, "id" | "storage_path" | "external_url">,
): Promise<Cutout> {
  const cached = cache.get(image.id);
  if (cached) return cached;

  const promise = (async () => {
    const bytes = image.storage_path
      ? await downloadStoredImage(image.storage_path)
      : await fetchRemoteImage(image.external_url!);
    return makeCutout(bytes);
  })();
  promise.catch(() => cache.delete(image.id));

  cache.set(image.id, promise);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return promise;
}

async function downloadStoredImage(path: string) {
  const { data, error } = await createSupabaseAdminClient().storage.from(PRODUCT_IMAGE_BUCKET).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

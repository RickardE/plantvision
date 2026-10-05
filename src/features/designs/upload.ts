"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { prepareImageForUpload } from "@/lib/images/prepare-upload";
import { ENVIRONMENT_BUCKET, thumbnailPath } from "@/lib/storage/buckets";
import { setDesignImage } from "./actions";

/** Uploads a room photo (full size + thumbnail) from the browser and attaches it to the design. */
export async function uploadDesignImage(designId: string, file: File) {
  const [full, thumb] = await Promise.all([
    prepareImageForUpload(file, { maxDimension: 2560 }),
    prepareImageForUpload(file, { maxDimension: 640 }),
  ]);
  const path = `${designId}/${crypto.randomUUID()}.jpg`;
  const supabase = getSupabaseBrowserClient();
  const storage = supabase.storage.from(ENVIRONMENT_BUCKET);

  const options = { contentType: "image/jpeg", cacheControl: "31536000", upsert: false };
  const [fullResult, thumbResult] = await Promise.all([
    storage.upload(path, full.blob, options),
    storage.upload(thumbnailPath(path), thumb.blob, options),
  ]);
  if (fullResult.error) throw fullResult.error;
  if (thumbResult.error) throw thumbResult.error;

  const result = await setDesignImage(designId, { path, width: full.width, height: full.height });
  if (!result.ok) throw new Error(result.error);
}

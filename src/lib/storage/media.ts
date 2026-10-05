import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";

import { ENVIRONMENT_BUCKET, VISUALIZATION_BUCKET } from "./buckets";

export { ENVIRONMENT_BUCKET, thumbnailPath, VISUALIZATION_BUCKET } from "./buckets";
export type MediaBucket = typeof ENVIRONMENT_BUCKET | typeof VISUALIZATION_BUCKET;

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Signs many private paths in one request. Returns a lookup; missing paths map to undefined. */
export async function signPaths(supabase: ServerSupabase, bucket: MediaBucket, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  for (const entry of data) {
    if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
  }
  return urls;
}

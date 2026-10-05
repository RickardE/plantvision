import type { VisualizationStatus } from "@/lib/supabase/types";

/** A generation still "pending" after this long has died (e.g. the server timed out). */
export const STALE_PENDING_MS = 10 * 60 * 1000;

export function effectiveStatus(v: { status: VisualizationStatus; created_at: string }): VisualizationStatus {
  return v.status === "pending" && Date.now() - new Date(v.created_at).getTime() > STALE_PENDING_MS
    ? "failed"
    : v.status;
}

import { NextResponse } from "next/server";
import { isUuid } from "@/lib/ids";
import { VISUALIZATION_BUCKET } from "@/lib/storage/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Redirects to a short-lived signed URL that downloads the visualization as a named JPEG. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/visualizations/[visualizationId]/download">,
) {
  const { visualizationId } = await params;
  if (!isUuid(visualizationId)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("visualizations")
    .select("result_path, created_at, alternative:design_alternatives(name, design:designs(name))")
    .eq("id", visualizationId)
    .maybeSingle();
  if (!data?.result_path) return NextResponse.json({ error: "not found" }, { status: 404 });

  const date = data.created_at.slice(0, 10);
  const fileName = `${data.alternative?.design?.name ?? "PlantVision"} - ${data.alternative?.name ?? ""} - ${date}.jpg`
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim();
  const { data: signed, error } = await supabase.storage
    .from(VISUALIZATION_BUCKET)
    .createSignedUrl(data.result_path, 60, { download: fileName });
  if (error) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.redirect(signed.signedUrl);
}

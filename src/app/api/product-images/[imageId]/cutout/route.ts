import { NextResponse } from "next/server";
import { loadProductCutout } from "@/features/products/cutout";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Product image with its background removed, served from our own origin so the design canvas
 * can use it without cross-origin restrictions. Requires a signed-in user (enforced by the proxy
 * and by RLS on the lookup below).
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/product-images/[imageId]/cutout">) {
  const { imageId } = await params;
  if (!isUuid(imageId)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("id, storage_path, external_url")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const cutout = await loadProductCutout(image);
    return new Response(new Uint8Array(cutout.png), {
      headers: {
        "content-type": "image/png",
        "cache-control": "private, max-age=604800, immutable",
        "x-image-width": String(cutout.width),
        "x-image-height": String(cutout.height),
      },
    });
  } catch (error) {
    console.error("Cutout failed", imageId, error);
    return NextResponse.json({ error: "image unavailable" }, { status: 502 });
  }
}

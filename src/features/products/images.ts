import { publicEnv } from "@/lib/env";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage/buckets";

export { PRODUCT_IMAGE_BUCKET };

export type ProductImageRef = {
  id: string;
  storage_path: string | null;
  external_url: string | null;
  position: number;
};

/** URL for showing a product image in an <img>. Supplier images are hotlinked. */
export function productImageSrc(image: Pick<ProductImageRef, "storage_path" | "external_url">): string {
  if (image.storage_path) {
    return `${publicEnv.supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${image.storage_path}`;
  }
  return image.external_url!;
}

/**
 * Same-origin URL of the image with its plain background removed. Used by the design canvas
 * (which needs CORS-clean pixels) and by the AI composition, so both see the same cut-out.
 */
export function productCutoutSrc(imageId: string): string {
  return `/api/product-images/${imageId}/cutout`;
}

export function primaryImage<T extends { position: number }>(images: T[] | null | undefined): T | undefined {
  if (!images?.length) return undefined;
  return images.reduce((best, img) => (img.position < best.position ? img : best));
}

import { formatDimensions } from "@/lib/utils";
import { primaryImage, productImageSrc } from "./images";
import type { ProductListItem } from "./queries";
import type { CategoryKind } from "@/lib/supabase/types";

/** Compact product shape used by the design editor's product picker. */
export type PickerProduct = {
  id: string;
  name: string;
  subtitle: string;
  imageId: string | null;
  thumbnailSrc: string | null;
  kind: CategoryKind | null;
  heightCm: number | null;
};

export function toPickerProduct(p: ProductListItem): PickerProduct {
  const image = primaryImage(p.images);
  return {
    id: p.id,
    name: p.name,
    subtitle: [formatDimensions(p), p.color].filter(Boolean).join(" · "),
    imageId: image?.id ?? null,
    thumbnailSrc: image ? productImageSrc(image) : null,
    kind: p.category?.kind ?? null,
    heightCm: p.height_cm,
  };
}

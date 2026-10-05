import type { Placement } from "@/lib/images/placement";
import type { CategoryKind as Kind } from "@/lib/supabase/types";

export type NewProduct = { aspect: number; heightCm: number | null; kind: Kind | null };
export type ExistingItem = Pick<Placement, "x" | "y" | "width"> & { aspect: number; kind: Kind | null };

/**
 * Real height a typical room photo covers at the spot where products stand. Only used to give
 * new items a believable starting size relative to each other; designers adjust from there.
 */
const PHOTO_HEIGHT_CM = 280;
const FALLBACK_HEIGHT_SHARE = 0.3;
const DEFAULT_CENTRE = { x: 0.5, y: 0.62 };
/** How deep a plant sits in its pot, as a share of the pot's height. */
const POT_OVERLAP = 0.15;
const CASCADE_STEP = 0.06;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Where a product added from the picker starts out:
 * - sized from its real height so a plant and a pot come out in proportion,
 * - a plant added while a pot is selected (or the other way round) is set into/under it,
 * - otherwise placed at the drop point or the default spot, nudged sideways so it never lands
 *   exactly on top of an existing item.
 */
export function initialPlacement(
  product: NewProduct,
  room: { width: number; height: number },
  existing: ExistingItem[],
  options: { anchor?: ExistingItem | null; drop?: { x: number; y: number } } = {},
): Placement {
  const heightShare = product.heightCm ? clamp(product.heightCm / PHOTO_HEIGHT_CM, 0.08, 0.7) : FALLBACK_HEIGHT_SHARE;
  const width = clamp(((heightShare * room.height) / room.width) * product.aspect, 0.03, 0.6);
  const base = { width, rotation: 0, flipX: false };

  const anchor = options.drop ? null : options.anchor;
  if (anchor && isPair(anchor.kind, product.kind)) {
    const anchorHeight = heightOf(anchor, room);
    if (product.kind === "plant") {
      const potTop = anchor.y - anchorHeight / 2;
      return { ...base, x: anchor.x, y: potTop + anchorHeight * POT_OVERLAP - heightShare / 2 };
    }
    const plantBottom = anchor.y + anchorHeight / 2;
    return { ...base, x: anchor.x, y: plantBottom - heightShare * POT_OVERLAP + heightShare / 2 };
  }

  let { x, y } = options.drop ?? DEFAULT_CENTRE;
  if (!options.drop) {
    // Keep the bottom edge on the visible floor.
    y = Math.min(y, 0.97 - heightShare / 2);
    for (let i = 0; i < 12 && existing.some((e) => Math.abs(e.x - x) < 0.02 && Math.abs(e.y - y) < 0.02); i++) {
      x = x + CASCADE_STEP > 0.9 ? 0.1 : x + CASCADE_STEP;
    }
  }
  return { ...base, x, y };
}

function isPair(a: Kind | null, b: Kind | null) {
  return (a === "pot" && b === "plant") || (a === "plant" && b === "pot");
}

/** Height of an item as a share of the room image's height. */
function heightOf(item: ExistingItem, room: { width: number; height: number }) {
  return (item.width * room.width) / item.aspect / room.height;
}

/**
 * Placement geometry shared by the design canvas (Konva) and the server-side composition
 * (sharp), so both render a design identically.
 *
 * A placement is stored relative to the environment image: `x`/`y` are the item's centre and
 * `width` its width, all as fractions of the image's width/height. The height follows the
 * product image's aspect ratio. Rotation is in degrees, clockwise, around the centre.
 */
export type Placement = {
  x: number;
  y: number;
  width: number;
  rotation: number;
  flipX: boolean;
};

export type PixelBox = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
};

/** Converts a placement into pixel geometry for an image of the given size. */
export function placementToPixels(
  placement: Placement,
  image: { width: number; height: number },
  productAspect: number,
): PixelBox {
  const width = placement.width * image.width;
  return {
    centerX: placement.x * image.width,
    centerY: placement.y * image.height,
    width,
    height: width / productAspect,
    rotation: placement.rotation,
  };
}

/** Axis-aligned bounds of a rotated box. */
export function rotatedBounds(box: PixelBox) {
  const radians = (box.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const width = box.width * cos + box.height * sin;
  const height = box.width * sin + box.height * cos;
  return {
    left: box.centerX - width / 2,
    top: box.centerY - height / 2,
    width,
    height,
  };
}

/** Normalises an angle to (-180, 180]. */
export function normalizeRotation(degrees: number) {
  const r = ((degrees % 360) + 360) % 360;
  return r > 180 ? r - 360 : r;
}

/** Keeps a placement inside the ranges the database accepts. */
export function clampPlacement(p: Placement): Placement {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  return {
    x: clamp(p.x, -0.5, 1.5),
    y: clamp(p.y, -0.5, 1.5),
    width: clamp(p.width, 0.01, 3),
    rotation: normalizeRotation(p.rotation),
    flipX: p.flipX,
  };
}

/**
 * Plain-language position used in the AI prompt, e.g. "centre at 32% from the left, bottom edge
 * at 81% from the top". The bottom edge is what anchors a plant or pot to the floor.
 */
export function describePosition(box: PixelBox, image: { width: number; height: number }) {
  const bounds = rotatedBounds(box);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return {
    centreFromLeft: pct(box.centerX / image.width),
    bottomFromTop: pct((bounds.top + bounds.height) / image.height),
    widthShare: pct(box.width / image.width),
    heightShare: pct(box.height / image.height),
  };
}

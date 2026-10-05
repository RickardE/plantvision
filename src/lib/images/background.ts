/**
 * Removes a plain, light background from product photos (typical supplier packshots on white)
 * by flood-filling from the image border. Pixels inside the product are never touched, even if
 * they are white, because the fill only spreads through pixels connected to the border.
 *
 * Operates on raw RGBA bytes so it is independent of the image library and easy to test.
 */
export type RgbaImage = { data: Uint8Array | Uint8ClampedArray; width: number; height: number };

const LIGHT_BACKGROUND_MIN = 225;

/** True when most border pixels are light and opaque, i.e. a packshot on a white/light backdrop. */
export function hasLightBackground({ data, width, height }: RgbaImage, minShare = 0.8): boolean {
  let light = 0;
  let total = 0;
  const check = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    total += 1;
    if (data[i + 3]! > 200 && Math.min(data[i]!, data[i + 1]!, data[i + 2]!) >= LIGHT_BACKGROUND_MIN) light += 1;
  };
  for (let x = 0; x < width; x++) {
    check(x, 0);
    check(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    check(0, y);
    check(width - 1, y);
  }
  return total > 0 && light / total >= minShare;
}

/**
 * Makes border-connected light pixels transparent. `tolerance` is how far below pure white a
 * channel may be and still count as background. Edge pixels next to the product get partial
 * alpha for a softer outline. Mutates and returns `image.data`.
 */
export function removeLightBackground(image: RgbaImage, tolerance = 28) {
  const { data, width, height } = image;
  const threshold = 255 - tolerance;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  const isBackground = (p: number) => {
    const i = p * 4;
    return data[i]! >= threshold && data[i + 1]! >= threshold && data[i + 2]! >= threshold;
  };
  const push = (p: number) => {
    if (!visited[p] && isBackground(p)) {
      visited[p] = 1;
      stack.push(p);
    }
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (stack.length) {
    const p = stack.pop()!;
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  // Soften the outline: opaque pixels touching removed background become semi-transparent in
  // proportion to how light they are (anti-aliased white fringe).
  for (let p = 0; p < width * height; p++) {
    if (visited[p]) continue;
    const x = p % width;
    const y = (p - x) / width;
    const touches =
      (x > 0 && visited[p - 1]) ||
      (x < width - 1 && visited[p + 1]) ||
      (y > 0 && visited[p - width]) ||
      (y < height - 1 && visited[p + width]);
    if (!touches) continue;
    const i = p * 4;
    const lightness = Math.min(data[i]!, data[i + 1]!, data[i + 2]!);
    if (lightness > 180) data[i + 3] = Math.round(data[i + 3]! * Math.max(0.35, (255 - lightness) / 75));
  }

  return data;
}

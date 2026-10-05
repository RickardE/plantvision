import { describe, expect, it } from "vitest";
import { hasLightBackground, removeLightBackground, type RgbaImage } from "./background";

/** Builds a w×h image filled with `bg`, with a filled rectangle of `fg`. */
function makeImage(
  w: number,
  h: number,
  bg: number[],
  fg: number[],
  rect: [number, number, number, number],
): RgbaImage {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = x >= rect[0] && x < rect[2] && y >= rect[1] && y < rect[3];
      data.set(inside ? fg : bg, (y * w + x) * 4);
    }
  }
  return { data, width: w, height: h };
}

const alphaAt = (img: RgbaImage, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];

describe("background removal", () => {
  it("detects a white packshot background", () => {
    expect(hasLightBackground(makeImage(10, 10, [255, 255, 255, 255], [20, 80, 20, 255], [3, 3, 7, 7]))).toBe(true);
    expect(hasLightBackground(makeImage(10, 10, [90, 90, 90, 255], [20, 80, 20, 255], [3, 3, 7, 7]))).toBe(false);
  });

  it("removes border-connected white and keeps the product", () => {
    const img = makeImage(12, 12, [250, 250, 250, 255], [30, 90, 40, 255], [3, 3, 9, 9]);
    removeLightBackground(img);
    expect(alphaAt(img, 0, 0)).toBe(0);
    expect(alphaAt(img, 11, 5)).toBe(0);
    expect(alphaAt(img, 5, 5)).toBe(255);
  });

  it("keeps white areas enclosed by the product (e.g. a white pot rim inside the outline)", () => {
    const img = makeImage(12, 12, [255, 255, 255, 255], [40, 40, 40, 255], [2, 2, 10, 10]);
    // White hole in the middle of the dark product, not connected to the border.
    for (let y = 5; y < 7; y++) for (let x = 5; x < 7; x++) img.data.set([255, 255, 255, 255], (y * 12 + x) * 4);
    removeLightBackground(img);
    expect(alphaAt(img, 5, 5)).toBe(255);
    expect(alphaAt(img, 0, 0)).toBe(0);
  });
});

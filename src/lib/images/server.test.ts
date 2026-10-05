import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { composeDesign, makeCutout, toJpegWithThumbnail } from "./server";

async function solid(width: number, height: number, color: { r: number; g: number; b: number }) {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .png()
    .toBuffer();
}

async function pixel(buffer: Buffer, x: number, y: number) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

describe("makeCutout", () => {
  it("removes a white packshot background and trims to the product", async () => {
    const product = await sharp({ create: { width: 100, height: 100, channels: 3, background: "#ffffff" } })
      .composite([{ input: await solid(40, 60, { r: 30, g: 110, b: 50 }), left: 30, top: 20 }])
      .jpeg()
      .toBuffer();
    const cutout = await makeCutout(product);
    expect(cutout.width).toBeGreaterThanOrEqual(40);
    expect(cutout.width).toBeLessThanOrEqual(44);
    expect(cutout.height).toBeGreaterThanOrEqual(60);
    const [, , , alphaCentre] = await pixel(cutout.png, Math.floor(cutout.width / 2), Math.floor(cutout.height / 2));
    expect(alphaCentre).toBe(255);
  });
});

describe("composeDesign", () => {
  it("places a product centred at its placement and clips at the edges", async () => {
    const room = await solid(400, 200, { r: 200, g: 200, b: 200 });
    const red = await solid(10, 10, { r: 255, g: 0, b: 0 });
    const { jpeg, width, height } = await composeDesign(room, [
      { x: 0.5, y: 0.5, width: 0.1, rotation: 0, flipX: false, png: red, aspect: 1 },
      // Mostly outside the image: must not throw.
      { x: 1.02, y: 0.5, width: 0.1, rotation: 30, flipX: true, png: red, aspect: 1 },
    ]);
    expect({ width, height }).toEqual({ width: 400, height: 200 });
    const [r, g] = await pixel(jpeg, 200, 100);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(60);
    const [bgR] = await pixel(jpeg, 20, 20);
    expect(bgR).toBeGreaterThan(180);
  });
});

describe("toJpegWithThumbnail", () => {
  it("bounds the size and creates a thumbnail", async () => {
    const big = await solid(3000, 1500, { r: 10, g: 20, b: 30 });
    const result = await toJpegWithThumbnail(big);
    expect(result.width).toBe(2560);
    expect((await sharp(result.thumb).metadata()).width).toBe(640);
  });
});

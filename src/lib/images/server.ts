import "server-only";
import sharp, { type OverlayOptions } from "sharp";
import { hasLightBackground, removeLightBackground } from "./background";
import { placementToPixels, type Placement } from "./placement";
import { assertPublicHttpsUrl } from "./public-host";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REMOTE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const CUTOUT_MAX_SIZE = 1024;

/**
 * Downloads a supplier image. Only https URLs on public hosts are fetched (also after redirects),
 * with a timeout and size cap, so an image URL can never reach internal services.
 */
export async function fetchRemoteImage(url: string): Promise<Buffer> {
  let target = new URL(url);
  let response: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHttpsUrl(target);
    response = await fetch(target, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) break;
    target = new URL(location, target);
    response = null;
  }
  if (!response) throw new Error("Too many redirects");
  if (!response.ok) throw new Error(`Image request failed with ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`Unexpected content type ${type}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_REMOTE_BYTES) throw new Error("Image too large");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_REMOTE_BYTES) throw new Error("Image too large");
  return buffer;
}

/**
 * Product image as a transparent PNG, trimmed to the product. Light packshot backgrounds are
 * removed; images that already have transparency are only trimmed.
 */
export async function makeCutout(input: Buffer): Promise<{ png: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(CUTOUT_MAX_SIZE, CUTOUT_MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const image = {
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  };
  if (hasLightBackground(image)) removeLightBackground(image);

  const trimmed = await sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 8 })
    .toBuffer({ resolveWithObject: true })
    // trim() throws when the whole image would be removed; fall back to the untrimmed image.
    .catch(() =>
      sharp(Buffer.from(image.data), { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer({ resolveWithObject: true }),
    );

  return { png: trimmed.data, width: trimmed.info.width, height: trimmed.info.height };
}

export type CompositionLayer = Placement & { png: Buffer; aspect: number };

/**
 * Renders the designer's composition: products pasted onto the room image at their stored
 * placement. This is the image the AI is asked to make photorealistic.
 */
export async function composeDesign(background: Buffer, layers: CompositionLayer[]) {
  // Apply EXIF orientation first so pixel coordinates match what the designer saw.
  const base = await sharp(background).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = base.info;

  const overlays: OverlayOptions[] = [];
  for (const layer of layers) {
    const box = placementToPixels(layer, { width, height }, layer.aspect);
    const targetWidth = Math.max(1, Math.round(box.width));
    const targetHeight = Math.max(1, Math.round(box.height));
    if (targetWidth > width * 4 || targetHeight > height * 4) continue;

    let pipeline = sharp(layer.png).resize(targetWidth, targetHeight, { fit: "fill" });
    if (layer.flipX) pipeline = pipeline.flop();
    let rendered = await pipeline.png().toBuffer({ resolveWithObject: true });
    if (layer.rotation) {
      // sharp rotates clockwise for positive angles, like Konva; the canvas grows to fit.
      rendered = await sharp(rendered.data)
        .rotate(layer.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer({ resolveWithObject: true });
    }
    const { width: w, height: h } = rendered.info;
    const left = Math.round(box.centerX - w / 2);
    const top = Math.round(box.centerY - h / 2);
    const clipped = await clipToCanvas(rendered.data, w, h, left, top, width, height);
    if (clipped) overlays.push(clipped);
  }

  const composed = await sharp(base.data).composite(overlays).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { jpeg: composed, width, height };
}

/** sharp cannot composite outside the base image, so crop overlays that stick out. */
async function clipToCanvas(
  png: Buffer,
  w: number,
  h: number,
  left: number,
  top: number,
  canvasWidth: number,
  canvasHeight: number,
): Promise<OverlayOptions | null> {
  const x0 = Math.max(0, left);
  const y0 = Math.max(0, top);
  const x1 = Math.min(canvasWidth, left + w);
  const y1 = Math.min(canvasHeight, top + h);
  if (x1 <= x0 || y1 <= y0) return null;
  if (x0 === left && y0 === top && x1 === left + w && y1 === top + h) return { input: png, left, top };
  const input = await sharp(png)
    .extract({ left: x0 - left, top: y0 - top, width: x1 - x0, height: y1 - y0 })
    .png()
    .toBuffer();
  return { input, left: x0, top: y0 };
}

/** Normalises any image to a JPEG with a bounded size, plus a small thumbnail for lists. */
export async function toJpegWithThumbnail(input: Buffer, maxSize = 2560, thumbSize = 640) {
  const full = await sharp(input)
    .rotate()
    .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(full.data).resize(thumbSize, thumbSize, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
  return { full: full.data, width: full.info.width, height: full.info.height, thumb };
}

export async function imageSize(input: Buffer) {
  const { info } = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}

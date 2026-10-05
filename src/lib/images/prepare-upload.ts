/**
 * Browser-side image preparation before upload: applies EXIF orientation, scales down to a
 * sensible maximum and re-encodes. Phone photos shrink from ~5–12 MB to well under 1 MB,
 * which matters on mobile data during a customer visit.
 */
export type PreparedImage = { blob: Blob; width: number; height: number; extension: "jpg" | "png" };

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

export async function prepareImageForUpload(
  file: File,
  { maxDimension, keepTransparency = false }: { maxDimension: number; keepTransparency?: boolean },
): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");

    const usePng = keepTransparency && file.type === "image/png";
    if (!usePng) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, usePng ? "image/png" : "image/jpeg", 0.88),
    );
    if (!blob) throw new Error("Could not encode image");
    return { blob, width, height, extension: usePng ? "png" : "jpg" };
  } finally {
    bitmap.close();
  }
}

export function fileNameToTitle(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, 200) || "Ny produkt";
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFormatter = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(value: string | Date) {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString("sv-SE", { maximumFractionDigits });
}

export function formatPrice(value: number) {
  return value.toLocaleString("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 });
}

/** "42 × 42 × 90 cm" from whichever dimensions are known. */
export function formatDimensions(d: { width_cm: number | null; depth_cm: number | null; height_cm: number | null }) {
  const parts = [d.width_cm, d.depth_cm, d.height_cm].filter((v): v is number => v != null);
  return parts.length ? `${parts.map((v) => formatNumber(Number(v))).join(" × ")} cm` : null;
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

/** Escapes LIKE/ILIKE wildcards so user input is matched literally. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

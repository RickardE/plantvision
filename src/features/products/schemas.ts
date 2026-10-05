import { z } from "zod";
import { sv } from "@/lib/i18n/sv";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalCm = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n >= 100000) {
      ctx.addIssue({ code: "custom", message: sv.validation.positiveNumber });
      return z.NEVER;
    }
    return Math.round(n * 10) / 10;
  });

const optionalPrice = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: sv.validation.price });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

/**
 * "Key: value" lines ↔ metadata object. Keeps metadata editable in a plain textarea, which is
 * simpler for non-technical admins than a dynamic key/value editor.
 */
export function metadataToText(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  return Object.entries(metadata as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
}

export function textToMetadata(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim().slice(0, 60);
    const value = line
      .slice(index + 1)
      .trim()
      .slice(0, 500);
    if (key && value) result[key] = value;
  }
  return result;
}

export const productFormSchema = z.object({
  name: z.string().trim().min(1, sv.validation.nameRequired).max(200),
  article_number: z.string().trim().min(1, sv.validation.articleNumberRequired).max(64),
  category_id: z.uuid(sv.validation.categoryRequired),
  status: z.enum(["active", "inactive"]).default("active"),
  botanical_name: optionalText(200),
  description: optionalText(4000),
  supplier: optionalText(120),
  color: optionalText(80),
  size_label: optionalText(120),
  light_requirement: z
    .enum(["low", "medium", "high", ""])
    .optional()
    .transform((v) => (v ? v : null)),
  width_cm: optionalCm,
  depth_cm: optionalCm,
  height_cm: optionalCm,
  price_sek: optionalPrice,
  metadata: z
    .string()
    .max(10000)
    .optional()
    .transform((v) => textToMetadata(v ?? "")),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const PAGE_SIZE = 24;

const optionalNumberParam = z.coerce.number().positive().max(100000).optional().catch(undefined);

/** Library filters live in the URL so results are shareable and survive reloads. */
export const productFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().max(80).optional().catch(undefined),
  light: z.enum(["low", "medium", "high"]).optional().catch(undefined),
  color: z.string().max(80).optional().catch(undefined),
  supplier: z.string().max(120).optional().catch(undefined),
  hmin: optionalNumberParam,
  hmax: optionalNumberParam,
  wmin: optionalNumberParam,
  wmax: optionalNumberParam,
  status: z.enum(["active", "inactive", "all"]).optional().catch(undefined),
  sort: z.enum(["name", "height_asc", "height_desc", "newest"]).default("name").catch("name"),
  page: z.coerce.number().int().min(1).max(50).default(1).catch(1),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

export function parseProductFilters(searchParams: Record<string, string | string[] | undefined>): ProductFilters {
  const flat = Object.fromEntries(
    Object.entries(searchParams)
      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      .filter(([, v]) => v !== undefined && v !== ""),
  );
  return productFiltersSchema.parse(flat);
}

/** Number of filters (besides search, category and sort) currently applied, for the filter button badge. */
export function countActiveFilters(filters: ProductFilters) {
  return [
    filters.light,
    filters.color,
    filters.supplier,
    filters.hmin,
    filters.hmax,
    filters.wmin,
    filters.wmax,
  ].filter((v) => v !== undefined).length;
}

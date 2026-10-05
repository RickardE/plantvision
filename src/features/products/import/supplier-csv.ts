import Papa from "papaparse";
import { sv } from "@/lib/i18n/sv";

/**
 * Parser for the supplier article file format used by Clarius and NoviFlora:
 * semicolon separated, `#` comment lines, header
 * `articleNo;description;statusCode;productGroupId;subtypeId;supplierId;priceIn;priceOut;stockable;salesAccount;color;size;pictureUrl`.
 *
 * Pure functions only, so the same code runs in the admin import action, the CLI script and tests.
 */

/** Supplier product groups mapped to PlantVision category slugs (see supabase migration). */
export const PRODUCT_GROUP_CATEGORY: Record<string, string> = {
  "100": "krukor",
  "102": "tillbehor",
  "107": "innerkrukor",
  "200": "vaxter",
  "300": "konstvaxter-mossa",
};

export const KNOWN_SUPPLIERS: Record<string, string> = {
  "132": "Clarius",
  "133": "NoviFlora",
};

export type ParsedProduct = {
  article_number: string;
  name: string;
  category_slug: string;
  supplier: string | null;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  size_label: string | null;
  color: string | null;
  price_sek: number | null;
  image_url: string | null;
  metadata: Record<string, string>;
};

export type ImportProblem = { line: number; articleNumber?: string; message: string };

export type ParseResult = {
  products: ParsedProduct[];
  rowsRead: number;
  duplicates: number;
  unknownGroups: Record<string, number>;
  problems: ImportProblem[];
};

const REQUIRED_COLUMNS = ["articleNo", "description", "productGroupId"] as const;

type RawRow = Record<string, string | undefined>;

export function parseSupplierCsv(text: string, options: { supplierName?: string } = {}): ParseResult {
  // Comment lines are removed up front but counted so reported line numbers match the file.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const kept: { line: number; text: string }[] = [];
  lines.forEach((line, index) => {
    if (line.trim() === "" || line.trimStart().startsWith("#")) return;
    kept.push({ line: index + 1, text: line });
  });

  const result: ParseResult = { products: [], rowsRead: 0, duplicates: 0, unknownGroups: {}, problems: [] };
  if (kept.length === 0) {
    result.problems.push({ line: 0, message: sv.validation.fileEmpty });
    return result;
  }

  const parsed = Papa.parse<RawRow>(kept.map((k) => k.text).join("\n"), {
    delimiter: ";",
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    result.problems.push({ line: kept[0]!.line, message: sv.validation.missingColumns(missing) });
    return result;
  }

  const seen = new Set<string>();
  parsed.data.forEach((row, index) => {
    const line = kept[index + 1]?.line ?? 0;
    result.rowsRead += 1;

    const articleNumber = clean(row.articleNo);
    const description = clean(row.description);
    const group = clean(row.productGroupId);

    if (!articleNumber || !description || !group) {
      result.problems.push({
        line,
        articleNumber: articleNumber ?? undefined,
        message: sv.validation.rowIncomplete,
      });
      return;
    }
    if (articleNumber.length > 64) {
      result.problems.push({ line, articleNumber, message: sv.validation.articleNumberTooLong });
      return;
    }

    const categorySlug = PRODUCT_GROUP_CATEGORY[group];
    if (!categorySlug) {
      result.unknownGroups[group] = (result.unknownGroups[group] ?? 0) + 1;
      return;
    }

    if (seen.has(articleNumber)) {
      result.duplicates += 1;
      return;
    }
    seen.add(articleNumber);

    const size = clean(row.size);
    const dims = parseDimensions(size);
    const rawColor = clean(row.color);
    const supplierId = clean(row.supplierId);
    const metadata: Record<string, string> = { supplier_product_group: group };
    if (supplierId) metadata.supplier_id = supplierId;
    if (rawColor && rawColor !== normalizeColor(rawColor)) metadata.supplier_color = rawColor;
    const opening = rawColor?.match(/Opening:\s*([\d.,]+)\s*cm/i)?.[1];
    if (opening) metadata.opening_cm = opening.replace(",", ".");

    result.products.push({
      article_number: articleNumber,
      name: normalizeName(description),
      category_slug: categorySlug,
      supplier: (supplierId && KNOWN_SUPPLIERS[supplierId]) || options.supplierName?.trim() || null,
      ...dims,
      size_label: size && dims.width_cm == null && dims.height_cm == null ? size.slice(0, 120) : null,
      color: normalizeColor(rawColor),
      price_sek: parseNumber(row.priceOut),
      image_url: normalizeImageUrl(row.pictureUrl),
      metadata,
    });
  });

  return result;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** "ARCHITECT CUBE 1 SVART (2026)" → "Architect Cube 1 Svart". Mixed-case names are kept. */
export function normalizeName(description: string): string {
  const withoutYear = description.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  const isAllCaps = withoutYear === withoutYear.toUpperCase() && /[A-ZÅÄÖ]/.test(withoutYear);
  const name = isAllCaps
    ? withoutYear
        .toLowerCase()
        .replace(/(^|[\s\-/+(])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    : withoutYear;
  return name.slice(0, 200);
}

export function parseNumber(value: string | undefined): number | null {
  const cleaned = value?.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

type Dimensions = { width_cm: number | null; depth_cm: number | null; height_cm: number | null };

/**
 * Supports both supplier formats:
 * - Clarius: "42x42x90" (width × depth × height) or "47x50" (diameter × height), cm.
 * - NoviFlora: "Bredd: 35 Höjd: 30" with comma decimals, values may be missing.
 */
export function parseDimensions(size: string | null): Dimensions {
  const none: Dimensions = { width_cm: null, depth_cm: null, height_cm: null };
  if (!size) return none;

  const labelled = size.match(/Bredd:\s*([\d.,]*)\s*Höjd:\s*([\d.,]*)/i);
  if (labelled) {
    return { width_cm: positive(labelled[1]), depth_cm: null, height_cm: positive(labelled[2]) };
  }

  const parts = size
    .toLowerCase()
    .split("x")
    .map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+(?:[.,]\d+)?$/.test(p))) return none;
  const values = parts.map((p) => positive(p));
  if (values.length === 3) return { width_cm: values[0]!, depth_cm: values[1]!, height_cm: values[2]! };
  return { width_cm: values[0]!, depth_cm: null, height_cm: values[1]! };
}

function positive(value: string | undefined): number | null {
  const n = parseNumber(value);
  return n != null && n > 0 && n < 100000 ? Math.round(n * 10) / 10 : null;
}

const COLOR_ALIASES: Record<string, string> = {
  svart: "Svart",
  black: "Svart",
  vit: "Vit",
  white: "Vit",
  grey: "Grå",
  gray: "Grå",
  grå: "Grå",
  brun: "Brun",
  brown: "Brun",
  natur: "Natur",
  nature: "Natur",
  red: "Röd",
  röd: "Röd",
  beige: "Beige",
  ivory: "Elfenben",
  latte: "Latte",
  cement: "Cement",
  silver: "Silver",
};

/**
 * Turns supplier colour strings into filterable values:
 * "SVART" → "Svart", "- - -" → null, "Light Grey(P3033-30-22) Depth:30cm/Opening:25cm" → "Light Grey",
 * "Round, Glossy White" → "Glossy White".
 */
export function normalizeColor(raw: string | null): string | null {
  if (!raw) return null;
  let value = raw
    .split("(")[0]!
    .replace(/Depth:.*$/i, "")
    .trim();
  value = value.replace(/^(Round|Square|Rectangle|Oval)\s*,\s*/i, "").trim();
  if (!value || /^[-\s]+$/.test(value)) return null;
  const alias = COLOR_ALIASES[value.toLowerCase()];
  if (alias) return alias;
  const titled = value.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
  return titled.slice(0, 80);
}

export function normalizeImageUrl(value: string | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

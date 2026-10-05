import { describe, expect, it } from "vitest";
import { countActiveFilters, metadataToText, parseProductFilters, productFormSchema, textToMetadata } from "./schemas";

describe("productFormSchema", () => {
  const base = {
    name: " Ficus lyrata ",
    article_number: "F-1",
    category_id: "3f0b1b0e-6f7e-4c64-9a1f-5b8c6c9e2a11",
  };

  it("trims text and converts empty optional fields to null", () => {
    const parsed = productFormSchema.parse({ ...base, botanical_name: "", width_cm: "", price_sek: "" });
    expect(parsed).toMatchObject({ name: "Ficus lyrata", botanical_name: null, width_cm: null, price_sek: null });
  });

  it("accepts comma decimals for dimensions and prices", () => {
    const parsed = productFormSchema.parse({ ...base, width_cm: "12,5", price_sek: "1 299,50" });
    expect(parsed.width_cm).toBe(12.5);
    expect(parsed.price_sek).toBe(1299.5);
  });

  it("rejects negative dimensions", () => {
    const result = productFormSchema.safeParse({ ...base, height_cm: "-3" });
    expect(result.success).toBe(false);
  });

  it("parses metadata lines", () => {
    const parsed = productFormSchema.parse({
      ...base,
      metadata: "Skötsel: Lättskött\nnot a pair\nUrsprung: Brasilien",
    });
    expect(parsed.metadata).toEqual({ Skötsel: "Lättskött", Ursprung: "Brasilien" });
  });
});

describe("metadata text", () => {
  it("round-trips", () => {
    const meta = { a: "1", "Key with space": "value: with colon" };
    expect(textToMetadata(metadataToText(meta))).toEqual(meta);
  });
});

describe("parseProductFilters", () => {
  it("ignores invalid values instead of failing the page", () => {
    const filters = parseProductFilters({ light: "bright", hmin: "abc", page: "0", sort: "random", q: "ficus" });
    expect(filters).toMatchObject({ light: undefined, hmin: undefined, page: 1, sort: "name", q: "ficus" });
  });

  it("counts active filters", () => {
    expect(countActiveFilters(parseProductFilters({ light: "low", hmin: "20", q: "x" }))).toBe(2);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeColor,
  normalizeImageUrl,
  normalizeName,
  parseDimensions,
  parseNumber,
  parseSupplierCsv,
} from "./supplier-csv";

const sample = readFileSync(new URL("../../../../tests/fixtures/supplier-sample.csv", import.meta.url), "utf8");

describe("parseSupplierCsv", () => {
  const result = parseSupplierCsv(sample);

  it("reads rows from both supplier formats and skips comments", () => {
    expect(result.rowsRead).toBeGreaterThan(20);
    expect(result.products.find((p) => p.article_number === "ARC-CU 1")).toMatchObject({
      name: "Architect Cubico 1 Svart",
      category_slug: "krukor",
      supplier: "Clarius",
      width_cm: 42,
      depth_cm: 42,
      height_cm: 90,
      color: "Svart",
      price_sek: 3272.5,
      image_url: "https://3wfactoryclarius.azurewebsites.net/Content/Files/Architect_Cubico_646.jpg",
    });
  });

  it("maps NoviFlora plants with labelled sizes", () => {
    const plant = result.products.find((p) => p.article_number === "ID17895773");
    expect(plant).toMatchObject({
      name: "Guzmania Priscilla",
      category_slug: "vaxter",
      supplier: "NoviFlora",
      width_cm: 10.5,
      height_cm: 30,
      depth_cm: null,
      color: null,
    });
  });

  it("keeps the first row of duplicated article numbers", () => {
    const rows = result.products.filter((p) => p.article_number === "ID2714078");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.price_sek).toBe(621.6);
    expect(result.duplicates).toBeGreaterThanOrEqual(1);
  });

  it("reports rows with missing required values and unknown product groups", () => {
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]!.line).toBeGreaterThan(30);
    expect(result.unknownGroups).toEqual({ "999": 1 });
  });

  it("extracts pot opening and keeps the raw supplier colour in metadata", () => {
    const pot = result.products.find((p) => p.article_number === "ID2945249");
    expect(pot?.color).toBe("Light Grey");
    expect(pot?.metadata).toMatchObject({ opening_cm: "25", supplier_product_group: "100" });
    expect(pot?.metadata.supplier_color).toContain("P3033");
  });

  it("fails clearly when required columns are missing", () => {
    const bad = parseSupplierCsv("foo;bar\n1;2\n");
    expect(bad.products).toHaveLength(0);
    expect(bad.problems[0]!.message).toMatch(/articleNo/);
  });

  it("uses the given supplier name for unknown supplier ids", () => {
    const csv = "articleNo;description;productGroupId;supplierId\nA-1;Pot (2026);100;999\n";
    expect(parseSupplierCsv(csv, { supplierName: "Acme" }).products[0]!.supplier).toBe("Acme");
  });
});

describe("parseDimensions", () => {
  it.each([
    ["42x42x90", { width_cm: 42, depth_cm: 42, height_cm: 90 }],
    ["47X58", { width_cm: 47, depth_cm: null, height_cm: 58 }],
    ["32.5x32.5x60.5", { width_cm: 32.5, depth_cm: 32.5, height_cm: 60.5 }],
    ["Bredd: 23 Höjd: 27,5", { width_cm: 23, depth_cm: null, height_cm: 27.5 }],
    ["Bredd:  Höjd: 425", { width_cm: null, depth_cm: null, height_cm: 425 }],
    ["Bredd: HOUTEN POT Höjd: BRUIN MAT", { width_cm: null, depth_cm: null, height_cm: null }],
    ["large", { width_cm: null, depth_cm: null, height_cm: null }],
    [null, { width_cm: null, depth_cm: null, height_cm: null }],
  ])("%s", (input, expected) => {
    expect(parseDimensions(input)).toEqual(expected);
  });
});

describe("normalizers", () => {
  it("normalizes names", () => {
    expect(normalizeName("LIGHT CLASSICO PLANTROLLER 60 (2026)")).toBe("Light Classico Plantroller 60");
    expect(normalizeName("Ficus lyrata (2026)")).toBe("Ficus lyrata");
    expect(normalizeName("ÖGLA SVART")).toBe("Ögla Svart");
  });

  it("normalizes colours", () => {
    expect(normalizeColor("SVART")).toBe("Svart");
    expect(normalizeColor("BLACK")).toBe("Svart");
    expect(normalizeColor("- - -")).toBeNull();
    expect(normalizeColor("Round, Glossy White")).toBe("Glossy White");
    expect(normalizeColor("Black washed")).toBe("Black Washed");
    expect(normalizeColor(null)).toBeNull();
  });

  it("parses numbers with comma decimals and rejects junk", () => {
    expect(parseNumber("1 234,5")).toBe(1234.5);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("-5")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });

  it("only accepts http(s) image urls and upgrades to https", () => {
    expect(normalizeImageUrl("http://img.example.com/a.jpg")).toBe("https://img.example.com/a.jpg");
    expect(normalizeImageUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeImageUrl("not a url")).toBeNull();
  });
});

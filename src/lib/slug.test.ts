import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("handles Swedish characters and symbols", () => {
    expect(slugify("Konstväxter & mossa")).toBe("konstvaxter-mossa");
    expect(slugify("  Öppet kontor ")).toBe("oppet-kontor");
    expect(slugify("!!!")).toBe("kategori");
  });
});

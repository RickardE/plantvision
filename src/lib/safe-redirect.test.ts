import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps in-app paths", () => {
    expect(safeNextPath("/products?q=ficus")).toBe("/products?q=ficus");
  });

  it.each([undefined, null, "", "https://evil.example", "//evil.example", "/\\evil.example", "products"])(
    "falls back for %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/projects");
    },
  );
});

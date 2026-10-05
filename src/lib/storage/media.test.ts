import { describe, expect, it } from "vitest";
import { thumbnailPath } from "./media";

describe("thumbnailPath", () => {
  it("prefixes the file name", () => {
    expect(thumbnailPath("design-1/abc.jpg")).toBe("design-1/thumb-abc.jpg");
    expect(thumbnailPath("a/b/c.png")).toBe("a/b/thumb-c.png");
  });
});

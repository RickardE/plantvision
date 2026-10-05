import { describe, expect, it } from "vitest";
import { clampPlacement, describePosition, normalizeRotation, placementToPixels, rotatedBounds } from "./placement";

describe("placement geometry", () => {
  const image = { width: 2000, height: 1000 };

  it("converts fractions to pixels using the product aspect ratio", () => {
    const box = placementToPixels({ x: 0.5, y: 0.6, width: 0.1, rotation: 0, flipX: false }, image, 0.5);
    expect(box).toEqual({ centerX: 1000, centerY: 600, width: 200, height: 400, rotation: 0 });
  });

  it("computes rotated bounds", () => {
    const bounds = rotatedBounds({ centerX: 100, centerY: 100, width: 100, height: 50, rotation: 90 });
    expect(bounds.width).toBeCloseTo(50);
    expect(bounds.height).toBeCloseTo(100);
    expect(bounds.left).toBeCloseTo(75);
  });

  it("normalises rotation", () => {
    expect(normalizeRotation(270)).toBe(-90);
    expect(normalizeRotation(-190)).toBe(170);
    expect(normalizeRotation(180)).toBe(180);
  });

  it("clamps to database ranges", () => {
    expect(clampPlacement({ x: 9, y: -9, width: 0, rotation: 400, flipX: true })).toEqual({
      x: 1.5,
      y: -0.5,
      width: 0.01,
      rotation: 40,
      flipX: true,
    });
  });

  it("describes position for the prompt", () => {
    const box = placementToPixels({ x: 0.25, y: 0.5, width: 0.1, rotation: 0, flipX: false }, image, 1);
    expect(describePosition(box, image)).toEqual({
      centreFromLeft: "25%",
      bottomFromTop: "60%",
      widthShare: "10%",
      heightShare: "20%",
    });
  });
});

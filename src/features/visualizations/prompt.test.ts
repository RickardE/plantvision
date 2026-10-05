import { describe, expect, it } from "vitest";
import { buildVisualizationPrompt, type PromptItem } from "./prompt";

const plant: PromptItem = {
  productName: "Ficus lyrata",
  kind: "plant",
  widthCm: 60,
  heightCm: 180,
  aspect: 0.5,
  referenceIndex: 1,
  x: 0.3,
  y: 0.6,
  width: 0.1,
  rotation: 0,
  flipX: false,
};

const pot: PromptItem = {
  ...plant,
  productName: "Architect Cube 1",
  kind: "pot",
  widthCm: 51,
  heightCm: 52,
  aspect: 1,
  referenceIndex: 0,
  rotation: 12.4,
  flipX: true,
};

describe("buildVisualizationPrompt", () => {
  const prompt = buildVisualizationPrompt({
    items: [plant, pot],
    image: { width: 1000, height: 800 },
    instructions: "  Kvällsljus från vänster  ",
  });

  it("lists products in reference image order with real sizes", () => {
    const potLine = prompt.indexOf(
      'planter/pot "Architect Cube 1" (real size: 51 cm wide, 52 cm tall) — reference image 2',
    );
    const plantLine = prompt.indexOf('plant "Ficus lyrata" (real size: 60 cm wide, 180 cm tall) — reference image 3');
    expect(potLine).toBeGreaterThan(0);
    expect(plantLine).toBeGreaterThan(potLine);
  });

  it("describes placement, size and orientation", () => {
    expect(prompt).toContain("centre 30% from the left edge");
    expect(prompt).toContain("rotated 12° clockwise, mirrored horizontally");
    // Plant: width 100px, height 200px at y=480 → bottom at 580px of 800 = 73%.
    expect(prompt).toContain("bottom edge 73% from the top");
  });

  it("includes the non-negotiable rules and the designer's instruction", () => {
    expect(prompt).toMatch(/Do not move, resize, add, remove or replace products/);
    expect(prompt).toContain("Keep the room exactly as in Image 1");
    expect(prompt).toContain(
      "Additional instruction from the designer (must not break the rules above): Kvällsljus från vänster",
    );
  });

  it("omits the instruction section when there is none", () => {
    const withoutExtra = buildVisualizationPrompt({ items: [plant], image: { width: 10, height: 10 } });
    expect(withoutExtra).not.toContain("Additional instruction");
  });
});

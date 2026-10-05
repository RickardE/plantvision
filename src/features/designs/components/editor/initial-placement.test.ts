import { describe, expect, it } from "vitest";
import { initialPlacement, type ExistingItem } from "./initial-placement";

const room = { width: 1600, height: 1200 };

describe("initialPlacement", () => {
  it("sizes products from their real height so they are in proportion", () => {
    const plant = initialPlacement({ aspect: 0.8, heightCm: 140, kind: "plant" }, room, []);
    const pot = initialPlacement({ aspect: 1, heightCm: 35, kind: "pot" }, room, []);
    const plantHeight = (plant.width * room.width) / 0.8;
    const potHeight = (pot.width * room.width) / 1;
    expect(plantHeight / potHeight).toBeCloseTo(4);
  });

  it("falls back to a default size without a height", () => {
    const p = initialPlacement({ aspect: 1, heightCm: null, kind: "other" }, room, []);
    expect((p.width * room.width) / room.height).toBeCloseTo(0.3);
  });

  it("nudges new items so they do not land exactly on an existing one", () => {
    const first = initialPlacement({ aspect: 1, heightCm: 50, kind: "pot" }, room, []);
    const existing: ExistingItem = { ...first, aspect: 1, kind: "pot" };
    const second = initialPlacement({ aspect: 1, heightCm: 50, kind: "pot" }, room, [existing]);
    expect(second.x).not.toBeCloseTo(first.x);
    expect(second.y).toBeCloseTo(first.y);
  });

  it("sets a plant into the selected pot", () => {
    const pot: ExistingItem = { x: 0.3, y: 0.8, width: 0.15, aspect: 1, kind: "pot" };
    const plant = initialPlacement({ aspect: 0.8, heightCm: 120, kind: "plant" }, room, [pot], { anchor: pot });
    const potHeight = (0.15 * room.width) / room.height;
    const plantHeight = (plant.width * room.width) / 0.8 / room.height;
    expect(plant.x).toBe(0.3);
    const plantBottom = plant.y + plantHeight / 2;
    expect(plantBottom).toBeGreaterThan(0.8 - potHeight / 2);
    expect(plantBottom).toBeLessThan(0.8);
  });

  it("uses the drop point as is", () => {
    const p = initialPlacement({ aspect: 1, heightCm: 50, kind: "pot" }, room, [], { drop: { x: 0.2, y: 0.3 } });
    expect(p).toMatchObject({ x: 0.2, y: 0.3 });
  });
});

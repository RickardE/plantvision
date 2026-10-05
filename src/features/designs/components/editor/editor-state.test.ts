import { describe, expect, it } from "vitest";
import { editorReducer, initialEditorState, type EditorItem } from "./editor-state";

const item = (key: string, x = 0.5): EditorItem => ({
  key,
  productId: `p-${key}`,
  productImageId: null,
  name: key,
  kind: null,
  x,
  y: 0.5,
  width: 0.2,
  rotation: 0,
  flipX: false,
});

describe("editorReducer", () => {
  it("adds and selects a new item", () => {
    const state = editorReducer(initialEditorState([]), { type: "add", item: item("a") });
    expect(state.items).toHaveLength(1);
    expect(state.selectedKey).toBe("a");
    expect(state.revision).toBe(1);
  });

  it("clamps updates and normalises rotation", () => {
    const state = editorReducer(initialEditorState([item("a")]), {
      type: "update",
      key: "a",
      patch: { x: 5, rotation: 370 },
    });
    expect(state.items[0]).toMatchObject({ x: 1.5, rotation: 10 });
  });

  it("duplicates with an offset and selects the copy", () => {
    const state = editorReducer(initialEditorState([item("a")]), { type: "duplicate", key: "a", newKey: "b" });
    expect(state.items.map((i) => i.key)).toEqual(["a", "b"]);
    expect(state.items[1]!.x).toBeCloseTo(0.53);
    expect(state.selectedKey).toBe("b");
  });

  it("reorders layers within bounds", () => {
    let state = initialEditorState([item("a"), item("b"), item("c")]);
    state = editorReducer(state, { type: "move-layer", key: "a", direction: "forward" });
    expect(state.items.map((i) => i.key)).toEqual(["b", "a", "c"]);
    const unchanged = editorReducer(state, { type: "move-layer", key: "c", direction: "forward" });
    expect(unchanged).toBe(state);
  });

  it("removes and clears selection, then undoes", () => {
    let state = editorReducer(initialEditorState([item("a")]), { type: "select", key: "a" });
    state = editorReducer(state, { type: "remove", key: "a" });
    expect(state.items).toHaveLength(0);
    expect(state.selectedKey).toBeNull();
    state = editorReducer(state, { type: "undo" });
    expect(state.items.map((i) => i.key)).toEqual(["a"]);
  });

  it("selection alone is not a saved change", () => {
    const state = editorReducer(initialEditorState([item("a")]), { type: "select", key: "a" });
    expect(state.revision).toBe(0);
    expect(state.history).toHaveLength(0);
  });
});

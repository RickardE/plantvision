import { clampPlacement, type Placement } from "@/lib/images/placement";
import type { CategoryKind } from "@/lib/supabase/types";

export type EditorItem = Placement & {
  /** Client-side identity; items are replaced wholesale on save. */
  key: string;
  productId: string;
  productImageId: string | null;
  name: string;
  /** Category kind, used to pair plants with pots when adding products. */
  kind: CategoryKind | null;
};

export type EditorState = {
  items: EditorItem[];
  selectedKey: string | null;
  /** Previous item lists for undo, most recent last. */
  history: EditorItem[][];
  /** Increments on every change that should be saved. */
  revision: number;
};

export type EditorAction =
  | { type: "add"; item: EditorItem }
  | { type: "update"; key: string; patch: Partial<Placement> }
  | { type: "remove"; key: string }
  | { type: "duplicate"; key: string; newKey: string }
  | { type: "move-layer"; key: string; direction: "forward" | "backward" }
  | { type: "select"; key: string | null }
  | { type: "undo" };

const HISTORY_LIMIT = 50;
const DUPLICATE_OFFSET = 0.03;

export function initialEditorState(items: EditorItem[]): EditorState {
  return { items, selectedKey: null, history: [], revision: 0 };
}

function commit(state: EditorState, items: EditorItem[], selectedKey = state.selectedKey): EditorState {
  return {
    items,
    selectedKey,
    history: [...state.history, state.items].slice(-HISTORY_LIMIT),
    revision: state.revision + 1,
  };
}

/** Pure reducer for the design editor. Array order is stacking order (last = front). */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "add":
      return commit(state, [...state.items, action.item], action.item.key);

    case "update": {
      const items = state.items.map((item) =>
        item.key === action.key ? { ...item, ...clampPlacement({ ...item, ...action.patch }) } : item,
      );
      return commit(state, items);
    }

    case "remove":
      return commit(
        state,
        state.items.filter((i) => i.key !== action.key),
        state.selectedKey === action.key ? null : state.selectedKey,
      );

    case "duplicate": {
      const source = state.items.find((i) => i.key === action.key);
      if (!source) return state;
      const copy = {
        ...source,
        key: action.newKey,
        ...clampPlacement({ ...source, x: source.x + DUPLICATE_OFFSET, y: source.y + DUPLICATE_OFFSET }),
      };
      return commit(state, [...state.items, copy], copy.key);
    }

    case "move-layer": {
      const index = state.items.findIndex((i) => i.key === action.key);
      const target = action.direction === "forward" ? index + 1 : index - 1;
      if (index < 0 || target < 0 || target >= state.items.length) return state;
      const items = [...state.items];
      [items[index], items[target]] = [items[target]!, items[index]!];
      return commit(state, items);
    }

    case "select":
      return state.selectedKey === action.key ? state : { ...state, selectedKey: action.key };

    case "undo": {
      const previous = state.history.at(-1);
      if (!previous) return state;
      const selectedKey = previous.some((i) => i.key === state.selectedKey) ? state.selectedKey : null;
      return { items: previous, selectedKey, history: state.history.slice(0, -1), revision: state.revision + 1 };
    }
  }
}

import { useEffect } from "react";
import type { EditorAction } from "./editor-state";

/** Desktop keyboard shortcuts: Delete, Escape, Ctrl/Cmd+Z, Ctrl/Cmd+D. */
export function useEditorShortcuts(selectedKey: string | null, dispatch: React.Dispatch<EditorAction>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [role=dialog]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (selectedKey && mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        dispatch({ type: "duplicate", key: selectedKey, newKey: crypto.randomUUID() });
      } else if (selectedKey && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        dispatch({ type: "remove", key: selectedKey });
      } else if (e.key === "Escape") {
        dispatch({ type: "select", key: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, dispatch]);
}

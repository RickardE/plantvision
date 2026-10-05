import { useCallback, useEffect, useRef, useState } from "react";
import { saveAlternativeItems } from "../../actions";
import type { EditorItem } from "./editor-state";

export type SaveState = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 800;
const RETRY_DELAY_MS = 4000;

/** Debounced autosave of the alternative's items. `flush()` saves immediately and reports success. */
export function useAutosave(alternativeId: string, items: EditorItem[], revision: number) {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const latest = useRef({ items, revision });
  const savedRevision = useRef(0);
  const inFlight = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    latest.current = { items, revision };
  }, [items, revision]);

  const saveNow = useCallback(async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current;
    const { items: snapshot, revision: snapshotRevision } = latest.current;
    if (snapshotRevision === savedRevision.current) return true;

    setSaveState("saving");
    const request = saveAlternativeItems(
      alternativeId,
      snapshot.map((item) => ({
        productId: item.productId,
        productImageId: item.productImageId,
        x: item.x,
        y: item.y,
        width: item.width,
        rotation: item.rotation,
        flipX: item.flipX,
      })),
    )
      .then((result) => result.ok)
      .catch(() => false);
    inFlight.current = request;
    const ok = await request;
    inFlight.current = null;
    if (ok) savedRevision.current = snapshotRevision;
    setSaveState(!ok ? "error" : latest.current.revision === savedRevision.current ? "saved" : "dirty");
    return ok;
  }, [alternativeId]);

  useEffect(() => {
    if (revision === savedRevision.current) return;
    setSaveState((s) => (s === "saving" ? s : "dirty"));
    const timer = setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revision, saveNow]);

  useEffect(() => {
    if (saveState !== "error") return;
    const timer = setTimeout(() => void saveNow(), RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [saveState, saveNow]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (latest.current.revision !== savedRevision.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { saveState, flush: saveNow };
}

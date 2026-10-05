"use client";

import { useRouter } from "next/navigation";
import { useCallback, useReducer, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  ChevronLeftIcon,
  CopyIcon,
  DownloadIcon,
  FlipHorizontal2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { PickerProduct } from "@/features/products/picker";
import { GenerateForm } from "@/features/visualizations/components/generate-form";
import { sv } from "@/lib/i18n/sv";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { createAlternative } from "../../actions";
import { EditorCanvas, type EditorCanvasHandle } from "./editor-canvas";
import { editorReducer, initialEditorState, type EditorItem } from "./editor-state";
import { loadCutout } from "./image-cache";
import { initialPlacement, type ExistingItem } from "./initial-placement";
import { ProductPicker } from "./product-picker";
import { ToolButton } from "./tool-button";
import { useAutosave } from "./use-autosave";
import { useEditorShortcuts } from "./use-editor-shortcuts";

export type DesignEditorProps = {
  design: { id: string; name: string; image: { url: string; width: number; height: number } };
  alternatives: { id: string; name: string }[];
  alternativeId: string;
  initialItems: EditorItem[];
  categories: { slug: string; name: string }[];
};

export function DesignEditor({ design, alternatives, alternativeId, initialItems, categories }: DesignEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<EditorCanvasHandle>(null);
  const [state, dispatch] = useReducer(editorReducer, initialItems, initialEditorState);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const { saveState, flush } = useAutosave(alternativeId, state.items, state.revision);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const selected = state.items.find((i) => i.key === state.selectedKey) ?? null;
  const { width: roomWidth, height: roomHeight } = design.image;

  const addProduct = useCallback(
    async (product: PickerProduct, drop?: { x: number; y: number }) => {
      if (!product.imageId) return;
      try {
        const image = await loadCutout(product.imageId);
        const room = { width: roomWidth, height: roomHeight };
        const withAspect = async (item: EditorItem): Promise<ExistingItem> => {
          const cutout = item.productImageId ? await loadCutout(item.productImageId) : null;
          return { ...item, aspect: cutout ? cutout.naturalWidth / cutout.naturalHeight : 1 };
        };
        const placement = initialPlacement(
          { aspect: image.naturalWidth / image.naturalHeight, heightCm: product.heightCm, kind: product.kind },
          room,
          state.items.map((item) => ({ ...item, aspect: 1 })),
          { anchor: selected ? await withAspect(selected) : null, drop },
        );
        dispatch({
          type: "add",
          item: {
            key: crypto.randomUUID(),
            productId: product.id,
            productImageId: product.imageId,
            name: product.name,
            kind: product.kind,
            ...placement,
          },
        });
        setPickerOpen(false);
      } catch {
        toast.error(sv.common.unknownError);
      }
    },
    [roomHeight, roomWidth, selected, state.items],
  );

  const goTo = (href: string) =>
    startNavigation(async () => {
      await flush();
      router.push(href);
    });

  const newAlternative = () =>
    startNavigation(async () => {
      if (!(await flush())) return void toast.error(sv.editor.saveFailed);
      const result = await createAlternative(design.id, alternativeId);
      if (!result.ok) return void toast.error(result.error);
      router.push(`/designs/${design.id}/editor?alt=${result.data.id}`);
    });

  const exportComposition = async () => {
    const blob = await canvasRef.current?.exportImage();
    if (!blob) return void toast.error(sv.common.unknownError);
    // A blob URL (not a data URL) keeps the file name and copes with large images.
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${design.name} – ${alternatives.find((a) => a.id === alternativeId)?.name ?? ""}.jpg`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  useEditorShortcuts(selected?.key ?? null, dispatch);

  const saveLabel = {
    saved: sv.common.saved,
    dirty: sv.editor.unsaved,
    saving: sv.common.saving,
    error: sv.editor.saveFailed,
  }[saveState];

  return (
    <div className="flex h-dvh flex-col bg-cream-100">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-cream-200 bg-cream-50 px-3 pt-safe pb-2 sm:px-4">
        <button
          type="button"
          onClick={() => goTo(`/designs/${design.id}`)}
          aria-label={sv.nav.back}
          className="mt-2 flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-card"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <div className="mt-2 min-w-0 flex-1">
          <p className="truncate font-serif text-xs tracking-[0.14em] text-coral-600 uppercase">{design.name}</p>
          <p
            className={cn("text-xs", saveState === "error" ? "text-red-700" : "text-ink-600")}
            role="status"
            data-testid="save-state"
            data-state={saveState}
          >
            {saveLabel}
          </p>
        </div>
        <Sheet open={generateOpen} onOpenChange={setGenerateOpen}>
          <SheetTrigger asChild>
            <Button
              variant="accent"
              className="mt-2"
              disabled={state.items.length === 0}
              title={state.items.length === 0 ? sv.editor.generateEmpty : undefined}
            >
              <SparklesIcon />
              <span className="hidden sm:inline">{sv.editor.generate}</span>
              <span className="sm:hidden">{sv.editor.generateShort}</span>
            </Button>
          </SheetTrigger>
          <SheetContent title={sv.editor.generateTitle}>
            <GenerateForm alternativeId={alternativeId} beforeGenerate={flush} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Alternatives */}
      <nav
        aria-label={sv.designs.alternatives}
        className="flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto border-b border-cream-200 bg-cream-50 px-3 py-2 sm:px-4"
      >
        {alternatives.map((alternative) => (
          <button
            key={alternative.id}
            type="button"
            disabled={navigating}
            onClick={() =>
              alternative.id !== alternativeId && goTo(`/designs/${design.id}/editor?alt=${alternative.id}`)
            }
            aria-current={alternative.id === alternativeId ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
              alternative.id === alternativeId ? "bg-forest-900 text-cream-50" : "bg-white text-ink-900 shadow-card",
            )}
          >
            {alternative.name}
          </button>
        ))}
        <button
          type="button"
          onClick={newAlternative}
          disabled={navigating}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-coral-600"
          title={sv.designs.duplicateAlternative}
        >
          <PlusIcon className="size-4" />
          {sv.designs.newAlternative}
        </button>
      </nav>

      {/* Canvas and (desktop) product panel */}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 p-3 sm:p-5">
          <EditorCanvas
            ref={canvasRef}
            roomUrl={design.image.url}
            roomWidth={roomWidth}
            roomHeight={roomHeight}
            items={state.items}
            selectedKey={state.selectedKey}
            onSelect={(key) => dispatch({ type: "select", key })}
            onChange={(key, patch) => dispatch({ type: "update", key, patch })}
            onDropProduct={(payload, position) => {
              try {
                void addProduct(JSON.parse(payload) as PickerProduct, position);
              } catch {
                // Ignore drops that are not products.
              }
            }}
          />
          {state.items.length === 0 ? (
            <p className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-white/90 px-4 py-2 text-sm text-ink-600 shadow-card">
              {sv.editor.empty}
            </p>
          ) : null}
        </div>
        {isDesktop ? (
          <aside className="flex w-80 flex-col border-l border-cream-200 bg-cream-50 p-4">
            <h2 className="mb-3 font-serif text-xl">{sv.editor.pickProduct}</h2>
            <ProductPicker categories={categories} onPick={(p) => void addProduct(p)} />
          </aside>
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="border-t border-cream-200 bg-cream-50 px-2 pt-2 pb-safe sm:px-4">
        {selected ? (
          <div className="flex items-center gap-0.5 sm:gap-1" data-testid="selection-toolbar">
            <p className="mr-2 hidden min-w-0 truncate text-sm font-medium sm:block sm:max-w-48">{selected.name}</p>
            {isDesktop ? null : (
              <ToolButton label={sv.editor.addToSelected} caption={sv.editor.add} onClick={() => setPickerOpen(true)}>
                <PlusIcon />
              </ToolButton>
            )}
            <ToolButton
              label={sv.editor.duplicate}
              caption={sv.editor.duplicateShort}
              onClick={() => dispatch({ type: "duplicate", key: selected.key, newKey: crypto.randomUUID() })}
            >
              <CopyIcon />
            </ToolButton>
            <ToolButton
              label={sv.editor.flip}
              caption={sv.editor.flipShort}
              onClick={() => dispatch({ type: "update", key: selected.key, patch: { flipX: !selected.flipX } })}
            >
              <FlipHorizontal2Icon />
            </ToolButton>
            <ToolButton
              label={sv.editor.forward}
              caption={sv.editor.forwardShort}
              onClick={() => dispatch({ type: "move-layer", key: selected.key, direction: "forward" })}
            >
              <ArrowUpToLineIcon />
            </ToolButton>
            <ToolButton
              label={sv.editor.backward}
              caption={sv.editor.backwardShort}
              onClick={() => dispatch({ type: "move-layer", key: selected.key, direction: "backward" })}
            >
              <ArrowDownToLineIcon />
            </ToolButton>
            <ToolButton
              label={sv.editor.remove}
              onClick={() => dispatch({ type: "remove", key: selected.key })}
              className="text-red-700"
            >
              <Trash2Icon />
            </ToolButton>
            <div className="hidden flex-1 sm:block" />
            <ToolButton label={sv.editor.done} onClick={() => dispatch({ type: "select", key: null })}>
              <XIcon />
            </ToolButton>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isDesktop ? (
              <p className="flex-1 text-sm text-ink-600">{sv.editor.selectHint}</p>
            ) : (
              <Button size="lg" className="flex-1" onClick={() => setPickerOpen(true)}>
                <PlusIcon />
                {sv.editor.addProduct}
              </Button>
            )}
            <ToolButton
              label={sv.common.undo}
              onClick={() => dispatch({ type: "undo" })}
              disabled={state.history.length === 0}
              className="min-w-14 flex-none"
            >
              <Undo2Icon />
            </ToolButton>
            <ToolButton
              label={sv.designs.exportComposition}
              onClick={() => void exportComposition()}
              disabled={state.items.length === 0}
              className="min-w-14 flex-none"
            >
              <DownloadIcon />
            </ToolButton>
          </div>
        )}
      </div>

      {isDesktop ? null : (
        <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
          <SheetContent title={sv.editor.pickProduct} size="full" className="h-[85dvh]">
            <ProductPicker categories={categories} onPick={(p) => void addProduct(p)} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

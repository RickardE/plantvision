"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { LoaderCircleIcon, PlusIcon, SearchIcon } from "lucide-react";
import type { PickerProduct } from "@/features/products/picker";
import { ProductImage } from "@/features/products/components/product-image";
import { sv } from "@/lib/i18n/sv";
import { cn } from "@/lib/utils";
import { PRODUCT_DRAG_TYPE } from "./editor-canvas";

type Category = { slug: string; name: string };

/**
 * Searchable product list for the editor. Tap a product to add it to the centre of the room,
 * or drag it onto the canvas (desktop).
 */
export function ProductPicker({
  categories,
  onPick,
}: {
  categories: Category[];
  onPick(product: PickerProduct): void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(categories[0]?.slug);
  const [page, setPage] = useState(1);
  const [debouncedQuery] = useDebounce(query, 250);
  const [result, setResult] = useState<{ key: string; products: PickerProduct[]; hasMore: boolean } | null>(null);
  const [error, setError] = useState(false);

  const params = new URLSearchParams();
  if (debouncedQuery) params.set("q", debouncedQuery);
  if (category) params.set("category", category);
  const baseKey = params.toString();
  params.set("page", String(page));
  const requestKey = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products?${requestKey}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { products: PickerProduct[]; hasMore: boolean }) => {
        setError(false);
        setResult({ key: requestKey, ...data });
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [requestKey]);

  const loading = result?.key !== requestKey && !error;
  const products = result?.products ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={sv.editor.searchProducts}
          aria-label={sv.editor.searchProducts}
          className="h-11 w-full rounded-full bg-white pr-4 pl-10 text-base shadow-card placeholder:text-ink-400 focus:outline-none"
        />
      </div>
      <div className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ slug: undefined, name: sv.common.all }, ...categories].map((c) => (
          <button
            key={c.slug ?? "all"}
            type="button"
            onClick={() => {
              setCategory(c.slug);
              setPage(1);
            }}
            aria-pressed={category === c.slug}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              category === c.slug ? "border-forest-900 bg-forest-900 text-cream-50" : "border-cream-300 bg-white",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-600">{sv.editor.tapToAdd}</p>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4" data-testid="product-picker-list" key={baseKey}>
        {error ? <p className="text-sm text-red-700">{sv.common.unknownError}</p> : null}
        {!loading && !error && products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-ink-600">
            <p>{sv.products.noResults}</p>
            {category && debouncedQuery ? (
              <button
                type="button"
                className="text-coral-600 underline"
                onClick={() => {
                  setCategory(undefined);
                  setPage(1);
                }}
              >
                {sv.editor.searchAllCategories}
              </button>
            ) : null}
          </div>
        ) : null}
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                disabled={!product.imageId}
                draggable={Boolean(product.imageId)}
                onDragStart={(e) => {
                  e.dataTransfer.setData(PRODUCT_DRAG_TYPE, JSON.stringify(product));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onPick(product)}
                className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-card disabled:opacity-40"
              >
                <ProductImage
                  src={product.thumbnailSrc ?? undefined}
                  alt={product.name}
                  className="aspect-square w-full p-1.5"
                />
                <span className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-white/95 shadow group-hover:bg-coral-500 group-hover:text-white">
                  <PlusIcon className="size-4" />
                </span>
                <span className="line-clamp-2 px-2 pt-1 text-xs leading-tight font-semibold">{product.name}</span>
                <span className="truncate px-2 pb-2 text-[11px] text-ink-600">{product.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
        {loading ? (
          <div className="flex justify-center py-4">
            <LoaderCircleIcon className="size-5 animate-spin text-ink-400" />
          </div>
        ) : result?.hasMore ? (
          <button
            type="button"
            className="mx-auto mt-3 block text-sm text-coral-600 underline"
            onClick={() => setPage((p) => p + 1)}
          >
            {sv.common.loadMore}
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { sv } from "@/lib/i18n/sv";

/** Lets the admin choose images before the product exists; they are uploaded after saving. */
export function ImagePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {previews.map((url, index) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-contain p-1" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              aria-label={sv.admin.removeImage}
              className="absolute top-1 right-1 rounded-full bg-white/90 p-1 shadow"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-cream-300 text-xs text-ink-600 hover:bg-cream-50"
        >
          <ImagePlusIcon className="size-6" />
          {sv.admin.addImages}
        </button>
      </div>
      <p className="text-xs text-ink-600">{sv.admin.imageHint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        data-testid="product-image-input"
        onChange={(e) => {
          onChange([...files, ...Array.from(e.target.files ?? [])].slice(0, 20));
          e.target.value = "";
        }}
      />
    </div>
  );
}

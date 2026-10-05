"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlusIcon, LoaderCircleIcon, StarIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";
import { makePrimaryImage, removeProductImage } from "../../actions";
import { productImageSrc, type ProductImageRef } from "../../images";
import { uploadProductImages } from "../../upload";
import { ProductImage } from "../product-image";

export function ImageManager({ productId, images }: { productId: string; images: ProductImageRef[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<{ ok: boolean; error?: string } | void>) =>
    startTransition(async () => {
      try {
        const result = await work();
        if (result && !result.ok) toast.error(result.error ?? sv.common.unknownError);
        router.refresh();
      } catch {
        toast.error(sv.common.unknownError);
      }
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5" aria-busy={pending}>
        {images.map((image, index) => (
          <div key={image.id} className="flex flex-col gap-1.5">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-card">
              <ProductImage src={productImageSrc(image)} alt="" className="size-full p-1" />
              {index === 0 ? (
                <Badge tone="positive" className="absolute top-1 left-1">
                  {sv.admin.primary}
                </Badge>
              ) : null}
            </div>
            <div className="flex justify-center gap-1">
              {index > 0 ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => makePrimaryImage(image.id))}
                  className="rounded-full p-2 text-ink-600 hover:bg-cream-200"
                  aria-label={sv.admin.makePrimary}
                  title={sv.admin.makePrimary}
                >
                  <StarIcon className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeProductImage(image.id))}
                className="rounded-full p-2 text-red-700 hover:bg-red-50"
                aria-label={sv.admin.removeImage}
                title={sv.admin.removeImage}
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-cream-300 text-xs text-ink-600 hover:bg-cream-50"
        >
          {pending ? <LoaderCircleIcon className="size-6 animate-spin" /> : <ImagePlusIcon className="size-6" />}
          {pending ? sv.admin.uploading : sv.admin.addImages}
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
          const files = Array.from(e.target.files ?? []).slice(0, 20);
          e.target.value = "";
          if (files.length) run(() => uploadProductImages(productId, files));
        }}
      />
    </div>
  );
}

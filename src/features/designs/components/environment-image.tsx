"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImageIcon, LoaderCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SOURCE_BYTES } from "@/lib/images/prepare-upload";
import { sv } from "@/lib/i18n/sv";
import { cn } from "@/lib/utils";
import { uploadDesignImage } from "../upload";

/** Room photo with upload (camera or file, drag-and-drop on desktop) and replace. */
export function EnvironmentImage({
  designId,
  image,
}: {
  designId: string;
  image: { url: string | undefined; width: number; height: number } | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(sv.errors.imageType);
    if (file.size > MAX_SOURCE_BYTES) return toast.error(sv.errors.imageTooLarge);
    startTransition(async () => {
      try {
        await uploadDesignImage(designId, file);
        router.refresh();
      } catch {
        toast.error(sv.common.unknownError);
      }
    });
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      hidden
      data-testid="room-image-input"
      onChange={(e) => {
        upload(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (image) {
    return (
      <div className="flex flex-col gap-2">
        <div
          className="relative overflow-hidden rounded-card bg-cream-200 shadow-card"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={sv.designs.roomImage} className="size-full object-cover" />
          {pending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <LoaderCircleIcon className="size-8 animate-spin text-forest-900" />
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          title={sv.designs.replaceImageWarning}
        >
          <RefreshCwIcon />
          {sv.designs.replaceImage}
        </Button>
        {input}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files[0]);
      }}
      className={cn(
        "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-cream-300 bg-cream-200/60 text-ink-900 transition-colors",
        dragging && "border-forest-700 bg-sage-100",
      )}
    >
      {pending ? (
        <LoaderCircleIcon className="size-8 animate-spin" />
      ) : (
        <ImageIcon className="size-8 text-ink-600" strokeWidth={1.5} />
      )}
      <span className="font-medium">{pending ? sv.admin.uploading : sv.designs.uploadImage}</span>
      <span className="text-sm text-ink-600 underline underline-offset-4">{sv.designs.uploadHint}</span>
      {input}
    </button>
  );
}

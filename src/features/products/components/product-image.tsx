"use client";

import { useState } from "react";
import { SproutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sv } from "@/lib/i18n/sv";

/**
 * Product photo with a graceful placeholder when there is no image or the supplier's image
 * host is unavailable. Plain <img>: images are already web-sized and may come from supplier
 * CDNs we do not control, so Next's optimiser would add cost without much gain.
 */
export function ProductImage({
  src,
  alt,
  className,
  fit = "contain",
  loading = "lazy",
}: {
  src: string | undefined;
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn("flex items-center justify-center bg-sage-100 text-sage-400", className)}
        role="img"
        aria-label={alt || sv.products.noImage}
      >
        <SproutIcon className="size-10" strokeWidth={1.4} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("bg-white", fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}

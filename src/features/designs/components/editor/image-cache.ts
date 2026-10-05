"use client";

import { useEffect, useState } from "react";
import { productCutoutSrc } from "@/features/products/images";

const cache = new Map<string, Promise<HTMLImageElement>>();

/** Loads (once) an image usable on a canvas that can still be exported (CORS-clean). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let promise = cache.get(src);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${src}`));
      image.src = src;
    });
    promise.catch(() => cache.delete(src));
    cache.set(src, promise);
  }
  return promise;
}

export function loadCutout(imageId: string) {
  return loadImage(productCutoutSrc(imageId));
}

/** React hook around loadImage. Returns undefined while loading or on failure. */
export function useLoadedImage(src: string | null | undefined) {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    loadImage(src)
      .then((image) => !cancelled && setLoaded({ src, image }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [src]);
  return loaded && loaded.src === src ? loaded.image : undefined;
}

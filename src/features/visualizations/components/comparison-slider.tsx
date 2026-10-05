"use client";

import { useState } from "react";
import { ChevronsLeftRightIcon } from "lucide-react";
import { sv } from "@/lib/i18n/sv";

/**
 * Before/after slider. The handle is a native range input underneath, so it works with touch,
 * mouse and keyboard, and is announced by screen readers.
 */
export function ComparisonSlider({
  beforeUrl,
  afterUrl,
  aspectRatio,
}: {
  beforeUrl: string;
  afterUrl: string;
  aspectRatio: number;
}) {
  const [position, setPosition] = useState(50);
  return (
    <div
      className="relative w-full overflow-hidden rounded-card bg-cream-200 shadow-card select-none"
      style={{ aspectRatio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={sv.visualizations.after}
        className="absolute inset-0 size-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeUrl} alt={sv.visualizations.before} className="size-full object-cover" draggable={false} />
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-ink-900/70 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase">
        {sv.visualizations.before}
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase">
        {sv.visualizations.after}
      </span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${position}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-900 shadow-lg">
          <ChevronsLeftRightIcon className="size-5" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`${sv.visualizations.before} / ${sv.visualizations.after}`}
        className="absolute inset-0 size-full cursor-ew-resize [touch-action:pan-y] opacity-0"
      />
    </div>
  );
}

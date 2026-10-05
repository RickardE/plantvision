import { cn } from "@/lib/utils";

/** Icon button with a visible caption; `label` is the full accessible name. */
export function ToolButton({
  label,
  caption = label,
  children,
  className,
  ...props
}: { label: string; caption?: string; children: React.ReactNode } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] text-ink-900 hover:bg-cream-200 disabled:opacity-40 sm:min-w-16 sm:flex-none [&_svg]:size-5",
        className,
      )}
      {...props}
    >
      {children}
      <span className="max-w-full truncate">{caption}</span>
    </button>
  );
}

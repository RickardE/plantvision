import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-card bg-white shadow-card", className)} {...props} />;
}

export function SectionLabel({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-sans text-xs font-semibold tracking-[0.12em] text-ink-600 uppercase", className)}
      {...props}
    />
  );
}

export function EmptyState({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-cream-300 px-6 py-10 text-center text-sm text-ink-600">
      {icon}
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: "neutral" | "positive" | "attention" | "negative" }) {
  const tones = {
    neutral: "bg-cream-200 text-ink-600",
    positive: "bg-sage-100 text-forest-800",
    attention: "bg-amber-100 text-amber-900",
    negative: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

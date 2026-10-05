import Link from "next/link";
import { cn } from "@/lib/utils";
import { sv } from "@/lib/i18n/sv";
import type { Category } from "../queries";

/** Horizontal, scrollable category filter chips ("Alla / Växter / Krukor …"). */
export function CategoryChips({
  categories,
  active,
  hrefFor,
}: {
  categories: Pick<Category, "slug" | "name">[];
  active: string | undefined;
  hrefFor: (slug: string | undefined) => string;
}) {
  const chips = [{ slug: undefined, name: sv.common.all }, ...categories];
  return (
    <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((chip) => {
        const isActive = chip.slug === active;
        return (
          <Link
            key={chip.slug ?? "all"}
            href={hrefFor(chip.slug)}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-forest-900 bg-forest-900 text-cream-50"
                : "border-cream-300 bg-white text-ink-900 hover:border-forest-700",
            )}
          >
            {chip.name}
          </Link>
        );
      })}
    </div>
  );
}

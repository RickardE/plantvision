"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { sv } from "@/lib/i18n/sv";
import { formatDateTime } from "@/lib/utils";

type Option = {
  id: string;
  url: string | undefined;
  createdAt: string;
  alternativeName: string;
  instructions: string | null;
};

/** Two visualizations side by side (stacked on phones), each chosen from a list. */
export function CompareView({ options, leftId, rightId }: { options: Option[]; leftId?: string; rightId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const left = options.find((o) => o.id === leftId) ?? options[0];
  const right = options.find((o) => o.id === rightId) ?? options.find((o) => o.id !== left?.id);

  const choose = (side: "a" | "b", id: string) => {
    const params = new URLSearchParams({ a: left?.id ?? "", b: right?.id ?? "" });
    params.set(side, id);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const label = (o: Option) => `${o.alternativeName} · ${formatDateTime(o.createdAt)}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(
        [
          ["a", left, sv.visualizations.left],
          ["b", right, sv.visualizations.right],
        ] as const
      ).map(([side, selected, title]) => (
        <figure key={side} className="flex flex-col gap-2">
          <Select aria-label={title} value={selected?.id ?? ""} onChange={(e) => choose(side, e.target.value)}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {label(o)}
              </option>
            ))}
          </Select>
          {selected?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.url} alt={label(selected)} className="w-full rounded-card shadow-card" />
          ) : null}
          {selected?.instructions ? (
            <figcaption className="text-xs text-ink-600">{selected.instructions}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

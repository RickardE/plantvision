"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";
import { sv } from "@/lib/i18n/sv";

/** Search box that keeps the query in the URL (`?q=`), debounced while typing. */
export function SearchBar({ placeholder = sv.products.searchPlaceholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const push = useDebouncedCallback((q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  }, 300);

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          push(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={sv.common.search}
        enterKeyHint="search"
        className="h-12 w-full rounded-full bg-white pr-11 pl-12 text-base shadow-card placeholder:text-ink-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {pending ? (
        <LoaderCircleIcon className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-ink-400" />
      ) : value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            push("");
            push.flush();
          }}
          aria-label={sv.common.close}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 text-ink-400 hover:text-ink-900"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

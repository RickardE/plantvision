"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanbanIcon, LeafIcon, SettingsIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sv } from "@/lib/i18n/sv";

const items = [
  { href: "/projects", label: sv.nav.projects, icon: FolderKanbanIcon, adminOnly: false },
  { href: "/products", label: sv.nav.products, icon: LeafIcon, adminOnly: false },
  { href: "/admin", label: sv.nav.admin, icon: SettingsIcon, adminOnly: true },
  { href: "/profile", label: sv.nav.profile, icon: UserRoundIcon, adminOnly: false },
] as const;

/** Bottom tab bar on phones, sidebar from the `lg` breakpoint. */
export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const visible = items.filter((item) => isAdmin || !item.adminOnly);

  return (
    <nav
      aria-label="Huvudmeny"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 pb-safe backdrop-blur",
        "lg:inset-y-0 lg:right-auto lg:w-60 lg:border-t-0 lg:border-r lg:pb-0",
      )}
    >
      <div className="hidden px-6 pt-8 pb-6 lg:block">
        <p className="font-serif text-2xl text-forest-900">{sv.app.brand}</p>
        <p className="text-xs tracking-[0.18em] text-coral-600 uppercase">{sv.app.name}</p>
      </div>
      <ul className="mx-auto flex max-w-md justify-around lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
        {visible.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 pt-2 pb-1 text-[11px] font-medium text-ink-400",
                  "lg:flex-row lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-sm",
                  active ? "text-forest-900 lg:bg-sage-100" : "hover:text-ink-900 lg:hover:bg-cream-200",
                )}
              >
                <Icon className="size-6 lg:size-5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

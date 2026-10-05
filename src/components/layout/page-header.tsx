import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { sv } from "@/lib/i18n/sv";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  kicker?: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, kicker, subtitle, backHref, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-start gap-3 pt-6 pb-5 lg:pt-10", className)}>
      {backHref ? (
        <Link
          href={backHref}
          aria-label={sv.nav.back}
          className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-card hover:bg-cream-50"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {kicker ? (
          <p className="truncate font-serif text-xs tracking-[0.14em] text-coral-600 uppercase">{kicker}</p>
        ) : null}
        <h1 className="text-3xl leading-tight break-words text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

/** Card-style row used for projects and rooms: thumbnail, title, subtitle, chevron. */
export function ListRow({
  href,
  title,
  subtitle,
  thumbnail,
}: {
  href: string;
  title: string;
  subtitle: string;
  thumbnail: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card bg-white p-3 pr-4 shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-cream-100">{thumbnail}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-900">{title}</p>
        <p className="truncate text-sm text-ink-600">{subtitle}</p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-400" />
    </Link>
  );
}

export function Thumbnail({ src, fallback }: { src: string | undefined; fallback: React.ReactNode }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-full object-cover" loading="lazy" />
  ) : (
    <div className="flex size-full items-center justify-center text-ink-400">{fallback}</div>
  );
}

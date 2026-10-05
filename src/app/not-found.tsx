import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { sv } from "@/lib/i18n/sv";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-4xl">{sv.errors.notFound}</h1>
      <p className="text-ink-600">{sv.errors.notFoundHint}</p>
      <Link href="/projects" className={buttonVariants({ className: "mt-4" })}>
        {sv.errors.goHome}
      </Link>
    </div>
  );
}

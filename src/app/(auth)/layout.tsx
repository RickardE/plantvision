import { sv } from "@/lib/i18n/sv";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-forest-900 text-cream-50">
      <div className="flex flex-1 flex-col justify-end px-6 pt-16 pb-10 sm:mx-auto sm:w-full sm:max-w-md sm:justify-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-coral-500 uppercase">{sv.app.brand}</p>
        <h1 className="mt-2 text-5xl">{sv.app.name}</h1>
        <p className="mt-3 text-cream-200/80">{sv.app.tagline}</p>
      </div>
      <div className="rounded-t-[2rem] bg-cream-100 px-6 pt-8 pb-safe text-ink-900 sm:mx-auto sm:mb-16 sm:w-full sm:max-w-md sm:rounded-[2rem] sm:pb-8">
        {children}
      </div>
    </div>
  );
}

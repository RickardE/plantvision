import { AppNav } from "@/components/layout/app-nav";
import { requireUser } from "@/features/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh lg:pl-60">
      <main className="mx-auto w-full max-w-5xl px-4 pt-safe pb-28 sm:px-6 lg:px-10 lg:pb-12">{children}</main>
      <AppNav isAdmin={user.role === "admin"} />
    </div>
  );
}

import { requireUser } from "@/features/auth/session";

/** Full-screen layout without the navigation bar, for the design editor. */
export default async function EditorLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return <main className="h-dvh overflow-hidden">{children}</main>;
}

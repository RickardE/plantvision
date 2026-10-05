import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { getCurrentUser } from "@/features/auth/session";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.auth.setPasswordTitle };

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=link");
  return <UpdatePasswordForm email={user.email} />;
}

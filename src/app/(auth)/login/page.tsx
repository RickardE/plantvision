import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.auth.signIn };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      linkError={error === "link" ? sv.auth.linkInvalid : undefined}
    />
  );
}

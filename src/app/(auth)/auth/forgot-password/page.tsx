import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.auth.forgotPassword };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-2xl">{sv.auth.forgotPassword}</h2>
      <FormMessage state={state} />
      <Field label={sv.auth.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {sv.auth.sendResetLink}
      </Button>
      <Link href="/login" className="self-center text-sm text-ink-600 underline underline-offset-4">
        {sv.auth.backToSignIn}
      </Link>
    </form>
  );
}

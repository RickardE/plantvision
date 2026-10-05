"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { sv } from "@/lib/i18n/sv";
import { signIn } from "../actions";
import { FormMessage } from "@/components/form-message";

export function LoginForm({ next, linkError }: { next?: string; linkError?: string }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-2xl">{sv.auth.welcome}</h2>
      <FormMessage state={state} fallbackError={linkError} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={sv.auth.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Field label={sv.auth.password} htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? sv.auth.signingIn : sv.auth.signIn}
      </Button>
      <Link href="/auth/forgot-password" className="self-center text-sm text-ink-600 underline underline-offset-4">
        {sv.auth.forgotPassword}
      </Link>
    </form>
  );
}

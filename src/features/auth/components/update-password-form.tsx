"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import { updatePassword } from "../actions";

export function UpdatePasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updatePassword, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage state={state} />
        <Link href="/projects" className={buttonVariants({ size: "lg" })}>
          {sv.nav.projects}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-2xl">{sv.auth.setPasswordTitle}</h2>
      <p className="text-sm text-ink-600">{email}</p>
      <FormMessage state={state} />
      {/* Lets password managers associate the new password with the account. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <Field
        label={sv.auth.newPassword}
        htmlFor="password"
        hint={sv.auth.setPasswordHint}
        error={state && !state.ok ? state.fieldErrors?.password : undefined}
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {sv.common.save}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import { updateProfile } from "../actions";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormMessage state={state} />
      <Field
        label={sv.profile.fullName}
        htmlFor="full_name"
        error={state && !state.ok ? state.fieldErrors?.full_name : undefined}
      >
        <Input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" required maxLength={120} />
      </Field>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? sv.common.saving : sv.common.save}
      </Button>
    </form>
  );
}

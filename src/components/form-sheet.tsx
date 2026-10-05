"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FormMessage } from "@/components/form-message";
import type { FormState } from "@/lib/actions/result";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";
import { sv } from "@/lib/i18n/sv";

type FormSheetProps = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  submitLabel: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Form fields. Receives field errors from the last submission. */
  children: (fieldErrors: Record<string, string>) => React.ReactNode;
};

/**
 * A small form in a bottom sheet (create project, add room, rename …). Closes itself when the
 * action succeeds; actions that navigate (redirect) simply leave the page.
 */
export function FormSheet({ trigger, title, description, submitLabel, action, children }: FormSheetProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.ok) setOpen(false);
    return result;
  }, null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent title={title} description={description}>
        <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4 pb-4">
          <FormMessage state={state && !state.ok ? state : null} />
          {children(state && !state.ok ? (state.fieldErrors ?? {}) : {})}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              {sv.common.cancel}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? sv.common.saving : submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { Dialog } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sv } from "@/lib/i18n/sv";

/**
 * Modal that is a bottom sheet on phones and a centred dialog from the `sm` breakpoint.
 * Built on Radix Dialog for focus trapping, escape handling and screen-reader semantics.
 */
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

type SheetContentProps = React.ComponentProps<typeof Dialog.Content> & {
  title: string;
  description?: string;
  size?: "md" | "lg" | "full";
};

export function SheetContent({ title, description, size = "md", className, children, ...props }: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/40" />
      <Dialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-cream-50 shadow-xl outline-none",
          "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "full" && "sm:h-[85dvh] sm:max-w-4xl",
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-cream-300 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
          <div>
            <Dialog.Title className="font-serif text-xl">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-1 text-sm text-ink-600">{description}</Dialog.Description>
            ) : null}
          </div>
          <Dialog.Close className="-mr-2 rounded-full p-2 text-ink-600 hover:bg-cream-200" aria-label={sv.common.close}>
            <XIcon className="size-5" />
          </Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-safe">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

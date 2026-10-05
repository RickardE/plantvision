"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sv } from "@/lib/i18n/sv";

type ConfirmButtonProps = {
  /** The trigger button's content. */
  children: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  "aria-label"?: string;
};

/** A button that asks for confirmation before running a destructive action. */
export function ConfirmButton({
  children,
  title,
  description = sv.common.confirmDelete,
  confirmLabel = sv.common.delete,
  onConfirm,
  variant = "outline",
  size,
  className,
  ...rest
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={variant} size={size} className={className} aria-label={rest["aria-label"]}>
          {children}
        </Button>
      </SheetTrigger>
      <SheetContent title={title} description={description}>
        <div className="flex gap-3 pt-2 pb-4">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            {sv.common.cancel}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

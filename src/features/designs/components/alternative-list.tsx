"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CopyIcon, PenLineIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import { sv } from "@/lib/i18n/sv";
import { createAlternative, deleteAlternative } from "../actions";
import type { DesignDetail } from "../queries";

export function AlternativeList({ design }: { design: DesignDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canEdit = Boolean(design.image);

  const add = (copyFrom: string | null) =>
    startTransition(async () => {
      const result = await createAlternative(design.id, copyFrom);
      if (!result.ok) return void toast.error(result.error);
      router.push(`/designs/${design.id}/editor?alt=${result.data.id}`);
    });

  return (
    <div className="flex flex-col gap-3">
      <Card className="divide-y divide-cream-200">
        {design.alternatives.map((alternative) => (
          <div key={alternative.id} className="flex items-center gap-2 py-2 pr-2 pl-4" data-testid="alternative-row">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{alternative.name}</p>
              <p className="text-xs text-ink-600">{sv.designs.items(alternative.itemCount)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={sv.designs.duplicateAlternative}
              title={sv.designs.duplicateAlternative}
              disabled={pending}
              onClick={() => add(alternative.id)}
            >
              <CopyIcon />
            </Button>
            {design.alternatives.length > 1 ? (
              <ConfirmButton
                title={`${sv.designs.deleteAlternative}: ${alternative.name}`}
                variant="ghost"
                size="icon-sm"
                aria-label={sv.designs.deleteAlternative}
                className="text-red-700"
                onConfirm={async () => {
                  const result = await deleteAlternative(alternative.id);
                  if (!result.ok) toast.error(result.error);
                  router.refresh();
                }}
              >
                <Trash2Icon />
              </ConfirmButton>
            ) : null}
            {canEdit ? (
              <Link
                href={`/designs/${design.id}/editor?alt=${alternative.id}`}
                className={buttonVariants({ size: "sm" })}
              >
                <PenLineIcon />
                {sv.common.edit}
              </Link>
            ) : null}
          </div>
        ))}
      </Card>
      <Button variant="link" className="self-start px-0" disabled={pending || !canEdit} onClick={() => add(null)}>
        <PlusIcon />
        {sv.designs.newAlternative}
      </Button>
    </div>
  );
}

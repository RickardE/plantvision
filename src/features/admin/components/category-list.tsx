"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { sv } from "@/lib/i18n/sv";
import type { CategoryKind } from "@/lib/supabase/types";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "../category-actions";

type CategoryRow = { id: string; name: string; kind: CategoryKind; productCount: number };

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CategoryKind>("plant");

  const run = (work: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) toast.error(result.error);
      else after?.();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <Card className="divide-y divide-cream-200">
        {categories.map((category, index) => (
          <div key={category.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
            <Input
              defaultValue={category.name}
              aria-label={sv.admin.categoryName}
              className="min-w-40 flex-1"
              maxLength={80}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== category.name)
                  run(() => updateCategory(category.id, { name, kind: category.kind }));
              }}
            />
            <Select
              defaultValue={category.kind}
              aria-label={sv.admin.categoryKind}
              className="w-36"
              onChange={(e) =>
                run(() => updateCategory(category.id, { name: category.name, kind: e.target.value as CategoryKind }))
              }
            >
              {Object.entries(sv.admin.categoryKinds).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <span className="w-20 text-right text-xs text-ink-600">{sv.products.count(category.productCount)}</span>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={sv.admin.moveUp}
                disabled={pending || index === 0}
                onClick={() => run(() => moveCategory(category.id, "up"))}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={sv.admin.moveDown}
                disabled={pending || index === categories.length - 1}
                onClick={() => run(() => moveCategory(category.id, "down"))}
              >
                <ArrowDownIcon />
              </Button>
              <ConfirmButton
                title={`${sv.common.delete}: ${category.name}`}
                variant="ghost"
                size="icon-sm"
                aria-label={sv.common.delete}
                className="text-red-700"
                onConfirm={async () => {
                  const result = await deleteCategory(category.id);
                  if (!result.ok) toast.error(result.error);
                  router.refresh();
                }}
              >
                <Trash2Icon />
              </ConfirmButton>
            </div>
          </div>
        ))}
      </Card>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim())
            run(
              () => createCategory({ name: newName, kind: newKind }),
              () => setNewName(""),
            );
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={sv.admin.newCategory}
          aria-label={sv.admin.newCategory}
          className="min-w-40 flex-1"
          maxLength={80}
        />
        <Select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as CategoryKind)}
          aria-label={sv.admin.categoryKind}
          className="w-36"
        >
          {Object.entries(sv.admin.categoryKinds).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={pending || !newName.trim()}>
          <PlusIcon />
          {sv.common.create}
        </Button>
      </form>
    </div>
  );
}

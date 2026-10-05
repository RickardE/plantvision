"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { fileNameToTitle } from "@/lib/images/prepare-upload";
import { sv } from "@/lib/i18n/sv";
import { createDraftProducts } from "../../actions";
import type { Category } from "../../queries";
import { uploadProductImages } from "../../upload";

type Entry = { file: File; name: string; preview: string };

/** Bulk add: one product per chosen image, named from the file name. */
export function BulkCreate({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const previews = useMemo(() => entries.map((e) => e.preview), [entries]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p)), [previews]);

  const create = () =>
    startTransition(async () => {
      const result = await createDraftProducts({ category_id: categoryId, status, names: entries.map((e) => e.name) });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      let failed = 0;
      for (const [index, id] of result.data.ids.entries()) {
        setProgress(index);
        try {
          await uploadProductImages(id, [entries[index]!.file]);
        } catch {
          failed += 1;
        }
      }
      setProgress(null);
      if (failed) toast.error(sv.common.unknownError);
      toast.success(sv.admin.bulk.created(result.data.ids.length));
      router.push("/admin/products?sort=newest");
    });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-600">{sv.admin.bulk.intro}</p>
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={sv.admin.bulk.categoryForAll} htmlFor="bulk-category">
          <Select id="bulk-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={sv.products.status} htmlFor="bulk-status">
          <Select id="bulk-status" value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
            <option value="active">{sv.products.statuses.active}</option>
            <option value="inactive">{sv.products.statuses.inactive}</option>
          </Select>
        </Field>
      </Card>

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry, index) => (
            <li key={entry.preview} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.preview} alt="" className="size-14 shrink-0 rounded-lg object-contain" />
              <Input
                aria-label={sv.products.name}
                value={entry.name}
                maxLength={200}
                onChange={(e) =>
                  setEntries((all) => all.map((x, i) => (i === index ? { ...x, name: e.target.value } : x)))
                }
              />
              <button
                type="button"
                aria-label={sv.admin.removeImage}
                onClick={() => setEntries((all) => all.filter((_, i) => i !== index))}
                className="rounded-full p-2 text-ink-600 hover:bg-cream-200"
              >
                <XIcon className="size-4" />
              </button>
              {progress !== null && progress >= index ? <span className="sr-only">{sv.admin.uploading}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={pending}>
          <ImagesIcon />
          {sv.admin.bulk.chooseImages}
        </Button>
        <Button
          onClick={create}
          disabled={pending || entries.length === 0 || entries.some((e) => !e.name.trim()) || !categoryId}
        >
          {pending
            ? progress !== null
              ? `${sv.admin.uploading} ${progress + 1}/${entries.length}`
              : sv.common.saving
            : sv.admin.bulk.create(entries.length)}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        data-testid="bulk-image-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          setEntries((all) =>
            [
              ...all,
              ...files.map((file) => ({ file, name: fileNameToTitle(file.name), preview: URL.createObjectURL(file) })),
            ].slice(0, 50),
          );
        }}
      />
    </div>
  );
}

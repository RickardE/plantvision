"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FileSpreadsheetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import { formatNumber } from "@/lib/utils";
import { previewSupplierImport, runSupplierImport, type ImportPreview } from "../../actions";
import type { Category } from "../../queries";

export function SupplierImport({ categories }: { categories: Category[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [supplier, setSupplier] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const formData = () => {
    const data = new FormData();
    data.set("file", file!);
    data.set("supplier", supplier);
    return data;
  };

  const loadPreview = (chosen: File) =>
    startTransition(async () => {
      setDoneMessage(null);
      const data = new FormData();
      data.set("file", chosen);
      data.set("supplier", supplier);
      const result = await previewSupplierImport(data);
      if (result.ok) setPreview(result.data);
      else toast.error(result.error);
    });

  const runImport = () =>
    startTransition(async () => {
      const result = await runSupplierImport(formData());
      if (result.ok) {
        setDoneMessage(result.message ?? null);
        setPreview(null);
        setFile(null);
      } else toast.error(result.error);
    });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-600">{sv.admin.import.intro}</p>
      {doneMessage ? <FormMessage state={{ ok: true, data: undefined, message: doneMessage }} /> : null}

      <Card className="flex flex-col gap-4 p-5">
        <Field label={sv.admin.import.supplierName} htmlFor="import-supplier" hint={sv.common.optional}>
          <Input id="import-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={120} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={pending}>
            <FileSpreadsheetIcon />
            {sv.admin.import.chooseFile}
          </Button>
          {file ? <span className="truncate text-sm text-ink-600">{file.name}</span> : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          hidden
          data-testid="import-file-input"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            e.target.value = "";
            if (!chosen) return;
            setFile(chosen);
            loadPreview(chosen);
          }}
        />
      </Card>

      {preview ? (
        <Card className="flex flex-col gap-4 p-5" data-testid="import-preview">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label={sv.admin.import.rowsRead} value={preview.rowsRead} />
            <Stat label={sv.admin.import.toImport} value={preview.toImport} />
            <Stat label={sv.admin.import.duplicates} value={preview.duplicates} />
            <Stat label={sv.admin.import.problems} value={preview.problems.length} />
          </dl>
          <div>
            <p className="mb-1 text-sm font-medium">{sv.admin.import.byCategory}</p>
            <ul className="text-sm text-ink-600">
              {Object.entries(preview.byCategory).map(([slug, count]) => (
                <li key={slug}>
                  {categoryName(slug)}: {formatNumber(count, 0)}
                </li>
              ))}
            </ul>
          </div>
          {Object.keys(preview.unknownGroups).length ? (
            <p className="text-sm text-amber-900">
              {sv.admin.import.unknownGroups}:{" "}
              {Object.entries(preview.unknownGroups)
                .map(([group, count]) => `${group} (${count})`)
                .join(", ")}
            </p>
          ) : null}
          {preview.problems.length ? (
            <ul className="max-h-40 overflow-y-auto text-xs text-red-800">
              {preview.problems.map((p, i) => (
                <li key={i}>
                  Rad {p.line}: {p.message}
                </li>
              ))}
            </ul>
          ) : null}
          <Button onClick={runImport} disabled={pending || preview.toImport === 0} className="self-start">
            {pending ? sv.admin.import.running : sv.admin.import.run(preview.toImport)}
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-100 p-3">
      <dt className="text-xs text-ink-600">{label}</dt>
      <dd className="text-xl font-semibold">{formatNumber(value, 0)}</dd>
    </div>
  );
}

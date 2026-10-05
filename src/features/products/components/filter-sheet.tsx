"use client";

import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sv } from "@/lib/i18n/sv";
import type { ProductFilters } from "../schemas";

type Facet = { value: string; count: number };

/** Filter form in a bottom sheet. A plain GET form, so filters end up in the URL. */
export function FilterSheet({
  action,
  filters,
  activeCount,
  colors,
  suppliers,
  showStatus = false,
}: {
  action: string;
  filters: ProductFilters;
  activeCount: number;
  colors: Facet[];
  suppliers: Facet[];
  showStatus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const clearParams = new URLSearchParams();
  if (filters.q) clearParams.set("q", filters.q);
  if (filters.category) clearParams.set("category", filters.category);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="md" className="relative">
          <SlidersHorizontalIcon />
          {sv.products.filters}
          {activeCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-coral-500 text-[11px] text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent title={sv.products.filters}>
        <Form action={action} scroll={false} onSubmit={() => setOpen(false)} className="flex flex-col gap-4 pb-4">
          {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
          {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}

          <Field label={sv.products.sort} htmlFor="f-sort">
            <Select id="f-sort" name="sort" defaultValue={filters.sort}>
              {Object.entries(sv.products.sortOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          {showStatus ? (
            <Field label={sv.products.status} htmlFor="f-status">
              <Select id="f-status" name="status" defaultValue={filters.status ?? "all"}>
                <option value="all">{sv.common.all}</option>
                <option value="active">{sv.products.statuses.active}</option>
                <option value="inactive">{sv.products.statuses.inactive}</option>
              </Select>
            </Field>
          ) : null}

          <Field label={sv.products.light} htmlFor="f-light">
            <Select id="f-light" name="light" defaultValue={filters.light ?? ""}>
              <option value="">{sv.common.all}</option>
              {Object.entries(sv.products.lightLevels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <RangeFields
            label={sv.products.heightRange}
            minName="hmin"
            maxName="hmax"
            min={filters.hmin}
            max={filters.hmax}
          />
          <RangeFields
            label={sv.products.widthRange}
            minName="wmin"
            maxName="wmax"
            min={filters.wmin}
            max={filters.wmax}
          />

          <Field label={sv.products.color} htmlFor="f-color">
            <Select id="f-color" name="color" defaultValue={filters.color ?? ""}>
              <option value="">{sv.common.all}</option>
              {colors.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value} ({c.count})
                </option>
              ))}
            </Select>
          </Field>

          <Field label={sv.products.supplier} htmlFor="f-supplier">
            <Select id="f-supplier" name="supplier" defaultValue={filters.supplier ?? ""}>
              <option value="">{sv.common.all}</option>
              {suppliers.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value} ({s.count})
                </option>
              ))}
            </Select>
          </Field>

          <div className="sticky bottom-0 -mx-5 flex gap-3 bg-cream-50 px-5 pt-3">
            <Link
              href={`${action}?${clearParams}`}
              scroll={false}
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: "outline", className: "flex-1" })}
            >
              {sv.products.clearFilters}
            </Link>
            <Button type="submit" className="flex-1">
              {sv.products.filters}
            </Button>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

function RangeFields({
  label,
  minName,
  maxName,
  min,
  max,
}: {
  label: string;
  minName: string;
  maxName: string;
  min?: number;
  max?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2">
        <Input
          name={minName}
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={sv.products.min}
          defaultValue={min}
          aria-label={`${label} ${sv.products.min}`}
        />
        <span className="text-ink-400">–</span>
        <Input
          name={maxName}
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={sv.products.max}
          defaultValue={max}
          aria-label={`${label} ${sv.products.max}`}
        />
      </div>
    </fieldset>
  );
}

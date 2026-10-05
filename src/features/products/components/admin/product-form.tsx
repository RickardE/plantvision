"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import type { FormState } from "@/lib/actions/result";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";
import { saveProduct } from "../../actions";
import type { Category, ProductDetail } from "../../queries";
import { metadataToText } from "../../schemas";
import { uploadProductImages } from "../../upload";
import { ImagePicker } from "./image-picker";

type Props = { product?: ProductDetail; categories: Category[] };

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const isNew = !product;

  const [state, formAction, pending] = useActionState(async (prev: FormState<{ id: string }>, formData: FormData) => {
    const result = await saveProduct(product?.id ?? null, prev, formData);
    if (!result?.ok) return result;
    if (isNew) {
      try {
        if (pendingFiles.length) await uploadProductImages(result.data.id, pendingFiles);
      } catch {
        toast.error(sv.common.unknownError);
      }
      toast.success(result.message);
      router.push(`/admin/products/${result.data.id}`);
    } else {
      toast.success(result.message);
      router.refresh();
    }
    return result;
  }, null);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state && !state.ok ? state : null} />

      {isNew ? (
        <section className="flex flex-col gap-3">
          <SectionLabel>{sv.admin.images}</SectionLabel>
          <ImagePicker files={pendingFiles} onChange={setPendingFiles} />
        </section>
      ) : null}

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={sv.products.name} htmlFor="name" error={errors.name} className="sm:col-span-2">
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
            maxLength={200}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label={sv.products.articleNumber} htmlFor="article_number" error={errors.article_number}>
          <Input
            id="article_number"
            name="article_number"
            defaultValue={product?.article_number}
            required
            maxLength={64}
            aria-invalid={Boolean(errors.article_number)}
          />
        </Field>
        <Field label={sv.products.category} htmlFor="category_id" error={errors.category_id}>
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? categories[0]?.id} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={sv.products.botanicalName} htmlFor="botanical_name" error={errors.botanical_name}>
          <Input
            id="botanical_name"
            name="botanical_name"
            defaultValue={product?.botanical_name ?? ""}
            maxLength={200}
          />
        </Field>
        <Field label={sv.products.status} htmlFor="status">
          <Select id="status" name="status" defaultValue={product?.status ?? "active"}>
            <option value="active">{sv.products.statuses.active}</option>
            <option value="inactive">{sv.products.statuses.inactive}</option>
          </Select>
        </Field>
      </Card>

      <Card className="grid grid-cols-3 gap-4 p-5">
        <Field label={`${sv.products.width} (cm)`} htmlFor="width_cm" error={errors.width_cm}>
          <Input id="width_cm" name="width_cm" inputMode="decimal" defaultValue={product?.width_cm ?? ""} />
        </Field>
        <Field label={`${sv.products.depth} (cm)`} htmlFor="depth_cm" error={errors.depth_cm}>
          <Input id="depth_cm" name="depth_cm" inputMode="decimal" defaultValue={product?.depth_cm ?? ""} />
        </Field>
        <Field label={`${sv.products.height} (cm)`} htmlFor="height_cm" error={errors.height_cm}>
          <Input id="height_cm" name="height_cm" inputMode="decimal" defaultValue={product?.height_cm ?? ""} />
        </Field>
        <Field label={sv.products.dimensions} htmlFor="size_label" hint={sv.admin.sizeLabelHint} className="col-span-3">
          <Input id="size_label" name="size_label" defaultValue={product?.size_label ?? ""} maxLength={120} />
        </Field>
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={sv.products.light} htmlFor="light_requirement">
          <Select id="light_requirement" name="light_requirement" defaultValue={product?.light_requirement ?? ""}>
            <option value="">{sv.common.none}</option>
            {Object.entries(sv.products.lightLevels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={sv.products.color} htmlFor="color" error={errors.color}>
          <Input id="color" name="color" defaultValue={product?.color ?? ""} maxLength={80} />
        </Field>
        <Field label={sv.products.supplier} htmlFor="supplier" error={errors.supplier}>
          <Input id="supplier" name="supplier" defaultValue={product?.supplier ?? ""} maxLength={120} />
        </Field>
        <Field label={`${sv.products.price} (kr)`} htmlFor="price_sek" error={errors.price_sek}>
          <Input id="price_sek" name="price_sek" inputMode="decimal" defaultValue={product?.price_sek ?? ""} />
        </Field>
        <Field label={sv.products.description} htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" name="description" defaultValue={product?.description ?? ""} maxLength={4000} />
        </Field>
        <Field label={sv.products.metadata} htmlFor="metadata" hint={sv.admin.metadataHint} className="sm:col-span-2">
          <Textarea
            id="metadata"
            name="metadata"
            defaultValue={metadataToText(product?.metadata)}
            className="font-mono text-sm"
          />
        </Field>
      </Card>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
          {pending ? sv.common.saving : isNew ? sv.common.create : sv.common.save}
        </Button>
      </div>
    </form>
  );
}

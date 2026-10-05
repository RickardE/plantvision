"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { fail, ok, PG, validationFailure, type ActionResult, type FormState } from "@/lib/actions/result";
import { sv } from "@/lib/i18n/sv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "./images";
import { productFormSchema } from "./schemas";
import { importProducts } from "./import/run-import";
import { parseSupplierCsv } from "./import/supplier-csv";

async function adminClient() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  return createSupabaseServerClient();
}

function revalidateProducts(productId?: string) {
  revalidatePath("/products");
  revalidatePath("/admin/products");
  if (productId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/admin/products/${productId}`);
  }
}

export async function saveProduct(
  productId: string | null,
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);

  const parsed = productFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const query = productId
    ? supabase.from("products").update(parsed.data).eq("id", productId).select("id").single()
    : supabase.from("products").insert(parsed.data).select("id").single();
  const { data, error } = await query;

  if (error) {
    if (error.code === PG.uniqueViolation) {
      return fail(sv.common.invalidInput, { article_number: sv.admin.articleNumberTaken });
    }
    return fail(sv.common.unknownError);
  }
  revalidateProducts(data.id);
  return ok({ id: data.id }, productId ? sv.admin.productSaved : sv.admin.productCreated);
}

export async function setProductStatus(productId: string, status: "active" | "inactive"): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const { error } = await supabase
    .from("products")
    .update({ status: z.enum(["active", "inactive"]).parse(status) })
    .eq("id", z.uuid().parse(productId));
  if (error) return fail(sv.common.unknownError);
  revalidateProducts(productId);
  return ok(undefined);
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const id = z.uuid().parse(productId);

  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return fail(error.code === PG.foreignKeyViolation ? sv.admin.deleteProductInUse : sv.common.unknownError);
  }
  const paths = (images ?? []).map((i) => i.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  revalidateProducts(id);
  return ok(undefined, sv.admin.productDeleted);
}

/** Storage paths must be `<productId>/<file>` so an admin cannot attach another product's files. */
const storagePathFor = (productId: string) =>
  z.string().regex(new RegExp(`^${productId}/[A-Za-z0-9_-]+\\.(jpg|png|webp)$`));

/** Registers images the browser has already uploaded to the product-images bucket. */
export async function addProductImages(productId: string, paths: string[]): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const id = z.uuid().parse(productId);
  const parsedPaths = z.array(storagePathFor(id)).min(1).max(20).safeParse(paths);
  if (!parsedPaths.success) return fail(sv.common.invalidInput);

  const { data: existing } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", id)
    .order("position", { ascending: false })
    .limit(1);
  const start = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from("product_images")
    .insert(parsedPaths.data.map((path, index) => ({ product_id: id, storage_path: path, position: start + index })));
  if (error) return fail(sv.common.unknownError);
  revalidateProducts(id);
  return ok(undefined);
}

export async function removeProductImage(imageId: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", z.uuid().parse(imageId))
    .select("product_id, storage_path")
    .single();
  if (error) return fail(sv.common.unknownError);
  if (data.storage_path) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([data.storage_path]);
  revalidateProducts(data.product_id);
  return ok(undefined);
}

/** Moves an image to the front; it becomes the product's primary image. */
export async function makePrimaryImage(imageId: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const id = z.uuid().parse(imageId);
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", id).single();
  if (!image) return fail(sv.common.unknownError);

  const { data: images } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("position");
  const ordered = [id, ...(images ?? []).map((i) => i.id).filter((i) => i !== id)];
  const results = await Promise.all(
    ordered.map((imgId, position) => supabase.from("product_images").update({ position }).eq("id", imgId)),
  );
  if (results.some((r) => r.error)) return fail(sv.common.unknownError);
  revalidateProducts(image.product_id);
  return ok(undefined);
}

const draftSchema = z.object({
  category_id: z.uuid(),
  status: z.enum(["active", "inactive"]),
  names: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
});

/** Creates several products at once (bulk add from images). Returns their ids in input order. */
export async function createDraftProducts(
  input: z.input<typeof draftSchema>,
): Promise<ActionResult<{ ids: string[] }>> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const rows = parsed.data.names.map((name) => ({
    name,
    category_id: parsed.data.category_id,
    status: parsed.data.status,
    article_number: generateArticleNumber(),
  }));
  const { data, error } = await supabase.from("products").insert(rows).select("id, article_number");
  if (error) return fail(sv.common.unknownError);
  const idByArticle = new Map(data.map((d) => [d.article_number, d.id]));
  revalidateProducts();
  return ok({ ids: rows.map((r) => idByArticle.get(r.article_number)!) });
}

function generateArticleNumber() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `PV-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

export type ImportPreview = {
  rowsRead: number;
  toImport: number;
  duplicates: number;
  byCategory: Record<string, number>;
  unknownGroups: Record<string, number>;
  problems: { line: number; message: string; articleNumber?: string }[];
};

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

async function readImportFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMPORT_BYTES) return null;
  const supplierName = String(formData.get("supplier") ?? "").slice(0, 120);
  return parseSupplierCsv(await file.text(), { supplierName });
}

export async function previewSupplierImport(formData: FormData): Promise<ActionResult<ImportPreview>> {
  if (!(await adminClient())) return fail(sv.common.notAllowed);
  const parsed = await readImportFile(formData);
  if (!parsed) return fail(sv.common.invalidInput);

  const byCategory: Record<string, number> = {};
  for (const product of parsed.products)
    byCategory[product.category_slug] = (byCategory[product.category_slug] ?? 0) + 1;
  return ok({
    rowsRead: parsed.rowsRead,
    toImport: parsed.products.length,
    duplicates: parsed.duplicates,
    byCategory,
    unknownGroups: parsed.unknownGroups,
    problems: parsed.problems.slice(0, 50),
  });
}

export async function runSupplierImport(
  formData: FormData,
): Promise<ActionResult<{ created: number; updated: number }>> {
  const supabase = await adminClient();
  if (!supabase) return fail(sv.common.notAllowed);
  const parsed = await readImportFile(formData);
  if (!parsed || parsed.products.length === 0) return fail(sv.common.invalidInput);

  try {
    const outcome = await importProducts(supabase, parsed.products);
    revalidateProducts();
    return ok(
      { created: outcome.created, updated: outcome.updated },
      sv.admin.import.done(outcome.created, outcome.updated),
    );
  } catch (error) {
    console.error("Supplier import failed", error);
    return fail(sv.common.unknownError);
  }
}

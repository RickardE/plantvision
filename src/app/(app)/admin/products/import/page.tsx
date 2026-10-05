import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierImport } from "@/features/products/components/admin/supplier-import";
import { listCategories } from "@/features/products/queries";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.import.title };

// Importing ~13 000 rows takes a few seconds; allow headroom on serverless platforms.
export const maxDuration = 60;

export default async function ImportProductsPage() {
  const categories = await listCategories();
  return (
    <div className="max-w-3xl">
      <PageHeader backHref="/admin" kicker={sv.admin.products} title={sv.admin.import.title} />
      <SupplierImport categories={categories} />
    </div>
  );
}

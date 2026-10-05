import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BulkCreate } from "@/features/products/components/admin/bulk-create";
import { listCategories } from "@/features/products/queries";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.bulk.title };

export default async function BulkProductsPage() {
  const categories = await listCategories();
  return (
    <div className="max-w-3xl">
      <PageHeader backHref="/admin" kicker={sv.admin.products} title={sv.admin.bulk.title} />
      <BulkCreate categories={categories} />
    </div>
  );
}

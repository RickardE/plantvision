import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/features/products/components/admin/product-form";
import { listCategories } from "@/features/products/queries";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.newProduct };

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <div className="max-w-3xl">
      <PageHeader backHref="/admin/products" kicker={sv.admin.products} title={sv.admin.newProduct} />
      <ProductForm categories={categories} />
    </div>
  );
}

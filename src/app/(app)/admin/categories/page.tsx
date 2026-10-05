import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryList } from "@/features/admin/components/category-list";
import { listCategoriesWithCounts } from "@/features/admin/queries";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.categories };

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <div className="max-w-3xl">
      <PageHeader backHref="/admin" kicker={sv.admin.title} title={sv.admin.categories} />
      <CategoryList categories={categories} />
    </div>
  );
}

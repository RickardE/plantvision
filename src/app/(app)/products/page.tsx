import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProductBrowser } from "@/features/products/components/product-browser";
import { parseProductFilters } from "@/features/products/schemas";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.products.title };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseProductFilters(await searchParams);
  return (
    <>
      <PageHeader kicker={sv.app.brand} title={sv.products.title} />
      <ProductBrowser basePath="/products" filters={filters} productHref={(id) => `/products/${id}`} />
    </>
  );
}

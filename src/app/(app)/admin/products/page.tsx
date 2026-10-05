import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ProductBrowser } from "@/features/products/components/product-browser";
import { parseProductFilters } from "@/features/products/schemas";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.products };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const filters = parseProductFilters(await searchParams);
  return (
    <>
      <PageHeader
        backHref="/admin"
        kicker={sv.admin.title}
        title={sv.admin.products}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ variant: "accent" })}>
            <PlusIcon />
            <span className="hidden sm:inline">{sv.admin.newProduct}</span>
            <span className="sr-only sm:hidden">{sv.admin.newProduct}</span>
          </Link>
        }
      />
      <ProductBrowser
        basePath="/admin/products"
        filters={filters}
        productHref={(id) => `/admin/products/${id}`}
        admin
      />
    </>
  );
}

import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";
import { getProductFacets, listCategories, searchProducts } from "../queries";
import { countActiveFilters, type ProductFilters } from "../schemas";
import { CategoryChips } from "./category-chips";
import { FilterSheet } from "./filter-sheet";
import { ProductCard, ProductGrid } from "./product-card";
import { SearchBar } from "./search-bar";

/**
 * Search, filter and browse products. Shared by the library (`/products`) and the admin
 * product list (`/admin/products`), which differ only in links and whether inactive
 * products are shown.
 */
export async function ProductBrowser({
  basePath,
  filters,
  productHref,
  admin = false,
}: {
  basePath: string;
  filters: ProductFilters;
  productHref: (id: string) => string;
  admin?: boolean;
}) {
  const [categories, facets, result] = await Promise.all([
    listCategories(),
    getProductFacets(),
    searchProducts(filters, { includeInactive: admin }),
  ]);

  const hrefWith = (changes: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes })) {
      if (
        value === undefined ||
        value === "" ||
        (key === "sort" && value === "name") ||
        (key === "page" && value === 1)
      )
        continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>
        <FilterSheet
          action={basePath}
          filters={filters}
          activeCount={countActiveFilters(filters) + (admin && filters.status && filters.status !== "all" ? 1 : 0)}
          colors={facets.colors}
          suppliers={facets.suppliers}
          showStatus={admin}
        />
      </div>
      <CategoryChips
        categories={categories}
        active={filters.category}
        hrefFor={(slug) => hrefWith({ category: slug, page: undefined })}
      />
      <p className="text-sm text-ink-600" aria-live="polite">
        {sv.products.count(result.total)}
      </p>
      {result.products.length === 0 ? (
        <EmptyState icon={<SearchXIcon className="size-8 text-ink-400" />}>{sv.products.noResults}</EmptyState>
      ) : (
        <ProductGrid>
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} href={productHref(product.id)} />
          ))}
        </ProductGrid>
      )}
      {result.hasMore ? (
        <Link
          href={hrefWith({ page: filters.page + 1 })}
          scroll={false}
          className={buttonVariants({ variant: "secondary", className: "self-center" })}
        >
          {sv.common.loadMore}
        </Link>
      ) : null}
    </div>
  );
}

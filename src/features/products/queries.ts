import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/utils";
import { PAGE_SIZE, type ProductFilters } from "./schemas";

const LIST_COLUMNS =
  "id, name, article_number, botanical_name, status, width_cm, depth_cm, height_cm, color, supplier, light_requirement, category:categories(id, name, slug, kind), images:product_images(id, storage_path, external_url, position)";

/** Cached per request: pages, filters and search all need the category list. */
export const listCategories = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, kind, sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data;
});

export type Category = Awaited<ReturnType<typeof listCategories>>[number];

/**
 * Product search used by the library, the admin list and the design editor's picker.
 * Search words are ANDed and matched anywhere in name, article number, botanical name, colour
 * and supplier (trigram index on products.search_text).
 */
export async function searchProducts(
  filters: ProductFilters,
  options: { includeInactive?: boolean; pageSize?: number } = {},
) {
  const supabase = await createSupabaseServerClient();
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const limit = pageSize * filters.page;

  let query = supabase
    .from("products")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("position", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });

  if (!options.includeInactive || filters.status === "active") query = query.eq("status", "active");
  else if (filters.status === "inactive") query = query.eq("status", "inactive");

  for (const word of (filters.q ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
    query = query.ilike("search_text", `%${escapeLike(word)}%`);
  }
  if (filters.category) {
    const categories = await listCategories();
    const category = categories.find((c) => c.slug === filters.category);
    if (category) query = query.eq("category_id", category.id);
  }
  if (filters.light) query = query.eq("light_requirement", filters.light);
  if (filters.color) query = query.eq("color", filters.color);
  if (filters.supplier) query = query.eq("supplier", filters.supplier);
  if (filters.hmin !== undefined) query = query.gte("height_cm", filters.hmin);
  if (filters.hmax !== undefined) query = query.lte("height_cm", filters.hmax);
  if (filters.wmin !== undefined) query = query.gte("width_cm", filters.wmin);
  if (filters.wmax !== undefined) query = query.lte("width_cm", filters.wmax);

  switch (filters.sort) {
    case "height_asc":
      query = query.order("height_cm", { ascending: true, nullsFirst: false });
      break;
    case "height_desc":
      query = query.order("height_cm", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("name");
  }
  query = query.order("id").range(0, limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? data.length;
  return { products: data, total, hasMore: total > limit };
}

export type ProductListItem = Awaited<ReturnType<typeof searchProducts>>["products"][number];

/** Cached per request: the page and its metadata share one lookup. */
export const getProduct = cache(async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id, name, slug, kind), images:product_images(id, storage_path, external_url, position)",
    )
    .eq("id", id)
    .order("position", { referencedTable: "product_images" })
    .maybeSingle();
  if (error) throw error;
  return data;
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export async function getProductFacets() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("product_facets");
  if (error) throw error;
  return {
    colors: data.filter((f) => f.facet === "color").map((f) => ({ value: f.value, count: f.product_count })),
    suppliers: data.filter((f) => f.facet === "supplier").map((f) => ({ value: f.value, count: f.product_count })),
  };
}

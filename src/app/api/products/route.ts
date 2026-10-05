import { NextResponse, type NextRequest } from "next/server";
import { toPickerProduct } from "@/features/products/picker";
import { searchProducts } from "@/features/products/queries";
import { parseProductFilters } from "@/features/products/schemas";

/** Product search for the design editor's picker (active products only). */
export async function GET(request: NextRequest) {
  const filters = parseProductFilters(Object.fromEntries(request.nextUrl.searchParams));
  const { products, hasMore, total } = await searchProducts(filters, { pageSize: 30 });
  return NextResponse.json({ products: products.map(toPickerProduct), hasMore, total });
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { ProductFacts, ProductGallery } from "@/features/products/components/product-details";
import { getProduct } from "@/features/products/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

export async function generateMetadata({ params }: PageProps<"/products/[productId]">): Promise<Metadata> {
  const { productId } = await params;
  const product = isUuid(productId) ? await getProduct(productId) : null;
  return { title: product?.name ?? sv.products.title };
}

export default async function ProductPage({ params }: PageProps<"/products/[productId]">) {
  const { productId } = await params;
  if (!isUuid(productId)) notFound();
  const [product, user] = await Promise.all([getProduct(productId), getCurrentUser()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        backHref="/products"
        kicker={product.category?.name}
        title={product.name}
        subtitle={product.botanical_name ? <span className="italic">{product.botanical_name}</span> : undefined}
        actions={
          user?.role === "admin" ? (
            <Link
              href={`/admin/products/${product.id}`}
              className={buttonVariants({ variant: "secondary", size: "icon" })}
              aria-label={sv.common.edit}
            >
              <PencilIcon />
            </Link>
          ) : null
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <ProductGallery product={product} />
        <ProductFacts product={product} />
      </div>
    </>
  );
}

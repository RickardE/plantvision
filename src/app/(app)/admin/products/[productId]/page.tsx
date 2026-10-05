import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/card";
import { ImageManager } from "@/features/products/components/admin/image-manager";
import { ProductAdminActions } from "@/features/products/components/admin/product-admin-actions";
import { ProductForm } from "@/features/products/components/admin/product-form";
import { getProduct, listCategories } from "@/features/products/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.editProduct };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[productId]">) {
  const { productId } = await params;
  if (!isUuid(productId)) notFound();
  const [product, categories] = await Promise.all([getProduct(productId), listCategories()]);
  if (!product) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        backHref="/admin/products"
        kicker={sv.admin.editProduct}
        title={product.name}
        actions={
          <Link
            href={`/products/${product.id}`}
            className={buttonVariants({ variant: "secondary", size: "icon" })}
            aria-label={sv.products.title}
          >
            <ExternalLinkIcon />
          </Link>
        }
      />
      <ProductAdminActions productId={product.id} status={product.status} />
      <section className="flex flex-col gap-3">
        <SectionLabel>{sv.admin.images}</SectionLabel>
        <ImageManager productId={product.id} images={product.images} />
      </section>
      <ProductForm key={product.updated_at} product={product} categories={categories} />
    </div>
  );
}

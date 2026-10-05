import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";
import { cn, formatDimensions } from "@/lib/utils";
import { primaryImage, productImageSrc } from "../images";
import type { ProductListItem } from "../queries";
import { ProductImage } from "./product-image";

export function ProductCard({ product, href }: { product: ProductListItem; href: string }) {
  const image = primaryImage(product.images);
  const dimensions = formatDimensions(product);
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square">
        <ProductImage
          src={image ? productImageSrc(image) : undefined}
          alt={product.name}
          className="size-full p-2 transition-transform group-hover:scale-[1.02]"
        />
        {product.status === "inactive" ? (
          <Badge tone="attention" className="absolute top-2 left-2">
            {sv.products.statuses.inactive}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-3 pt-2 pb-3">
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-ink-900">{product.name}</p>
        {product.botanical_name ? (
          <p className="truncate text-xs text-ink-600 italic">{product.botanical_name}</p>
        ) : null}
        <p className={cn("mt-auto truncate pt-1 text-xs text-ink-400")}>
          {[dimensions, product.color].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">{children}</div>;
}

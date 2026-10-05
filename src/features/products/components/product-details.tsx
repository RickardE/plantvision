import { Badge, Card } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";
import { formatDimensions, formatPrice } from "@/lib/utils";
import { productImageSrc } from "../images";
import type { ProductDetail } from "../queries";
import { ProductImage } from "./product-image";

export function ProductGallery({ product }: { product: ProductDetail }) {
  const images = product.images;
  if (images.length === 0) {
    return <ProductImage src={undefined} alt={product.name} className="aspect-square w-full rounded-card" />;
  }
  return (
    <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {images.map((image, index) => (
        <ProductImage
          key={image.id}
          src={productImageSrc(image)}
          alt={`${product.name} ${index + 1}`}
          loading={index === 0 ? "eager" : "lazy"}
          className="aspect-square w-[85%] shrink-0 snap-center rounded-card p-4 shadow-card sm:w-full"
        />
      ))}
    </div>
  );
}

export function ProductFacts({ product }: { product: ProductDetail }) {
  const metadata = Object.entries((product.metadata ?? {}) as Record<string, unknown>).filter(
    ([key]) => !key.startsWith("supplier_"),
  );
  const rows: [string, React.ReactNode][] = [
    [sv.products.articleNumber, product.article_number],
    [sv.products.category, product.category?.name],
    [sv.products.dimensions, formatDimensions(product) ?? product.size_label],
    [sv.products.light, product.light_requirement ? sv.products.lightLevels[product.light_requirement] : null],
    [sv.products.color, product.color],
    [sv.products.supplier, product.supplier],
    [sv.products.price, product.price_sek != null ? formatPrice(Number(product.price_sek)) : null],
    ...metadata.map(([key, value]) => [key, String(value)] as [string, React.ReactNode]),
  ];

  return (
    <div className="flex flex-col gap-4">
      {product.status === "inactive" ? (
        <Badge tone="attention" className="self-start">
          {sv.products.statuses.inactive}
        </Badge>
      ) : null}
      {product.description ? <p className="leading-relaxed text-ink-600">{product.description}</p> : null}
      <Card className="divide-y divide-cream-200 px-4">
        <dl>
          {rows
            .filter(([, value]) => value != null && value !== "")
            .map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-ink-600">{label}</dt>
                <dd className="text-right font-medium break-words">{value}</dd>
              </div>
            ))}
        </dl>
      </Card>
    </div>
  );
}

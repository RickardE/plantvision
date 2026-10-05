import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignEditorLoader } from "@/features/designs/components/editor/design-editor-loader";
import { getEditorData } from "@/features/designs/queries";
import { listCategories } from "@/features/products/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

// AI generation started from this page runs after the response (see generateVisualization).
export const maxDuration = 300;

export const metadata: Metadata = { title: sv.editor.title };

export default async function EditorPage({ params, searchParams }: PageProps<"/designs/[designId]/editor">) {
  const { designId } = await params;
  const { alt } = await searchParams;
  if (!isUuid(designId)) notFound();

  const [data, categories] = await Promise.all([
    getEditorData(designId, typeof alt === "string" ? alt : undefined),
    listCategories(),
  ]);
  if (!data) notFound();
  // Without a room photo (or any alternative) there is nothing to design on yet.
  if (!data.design.image?.url || !data.alternative) redirect(`/designs/${designId}`);

  return (
    <DesignEditorLoader
      key={data.alternative.id}
      design={{
        id: data.design.id,
        name: data.design.name,
        image: { url: data.design.image.url, width: data.design.image.width, height: data.design.image.height },
      }}
      alternatives={data.design.alternatives.map((a) => ({ id: a.id, name: a.name }))}
      alternativeId={data.alternative.id}
      initialItems={data.items.map((item) => ({
        key: item.id,
        productId: item.product.id,
        productImageId: item.product.imageId,
        name: item.product.name,
        kind: item.product.kind,
        x: item.x,
        y: item.y,
        width: item.width,
        rotation: item.rotation,
        flipX: item.flipX,
      }))}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}

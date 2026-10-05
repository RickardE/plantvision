import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { getDesign } from "@/features/designs/queries";
import { CompareView } from "@/features/visualizations/components/compare-view";
import { getComparableVisualizations } from "@/features/visualizations/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.visualizations.compareTitle };

export default async function ComparePage({ params, searchParams }: PageProps<"/designs/[designId]/compare">) {
  const { designId } = await params;
  const { a, b } = await searchParams;
  if (!isUuid(designId)) notFound();
  const [design, options] = await Promise.all([getDesign(designId), getComparableVisualizations(designId)]);
  if (!design) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader backHref={`/designs/${design.id}`} kicker={design.name} title={sv.visualizations.compareTitle} />
      {options.length < 2 ? (
        <EmptyState>{sv.visualizations.pickTwo}</EmptyState>
      ) : (
        <CompareView
          options={options}
          leftId={typeof a === "string" ? a : undefined}
          rightId={typeof b === "string" ? b : undefined}
        />
      )}
    </div>
  );
}

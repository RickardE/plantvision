import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ColumnsIcon, PencilIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, SectionLabel } from "@/components/ui/card";
import { AlternativeList } from "@/features/designs/components/alternative-list";
import { DeleteDesignButton } from "@/features/designs/components/delete-buttons";
import { EnvironmentImage } from "@/features/designs/components/environment-image";
import { RenameDesignSheet } from "@/features/designs/components/project-sheets";
import { getDesign } from "@/features/designs/queries";
import { VisualizationGrid } from "@/features/visualizations/components/visualization-grid";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

export async function generateMetadata({ params }: PageProps<"/designs/[designId]">): Promise<Metadata> {
  const { designId } = await params;
  const design = isUuid(designId) ? await getDesign(designId) : null;
  return { title: design?.name ?? sv.designs.rooms };
}

export default async function DesignPage({ params }: PageProps<"/designs/[designId]">) {
  const { designId } = await params;
  if (!isUuid(designId)) notFound();
  const design = await getDesign(designId);
  if (!design) notFound();

  const succeeded = design.visualizations.filter((v) => v.status === "succeeded");
  const firstAlternative = design.alternatives[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref={`/projects/${design.project.id}`}
        kicker={design.project.name}
        title={design.name}
        actions={
          <RenameDesignSheet
            design={design}
            trigger={
              <Button variant="secondary" size="icon" aria-label={sv.common.rename}>
                <PencilIcon />
              </Button>
            }
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="flex flex-col gap-3">
          <SectionLabel>{sv.designs.roomImage}</SectionLabel>
          <EnvironmentImage designId={design.id} image={design.image} />
          {design.image && firstAlternative ? (
            <Link
              href={`/designs/${design.id}/editor?alt=${firstAlternative.id}`}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              <SparklesIcon />
              {sv.designs.openEditor}
            </Link>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>{sv.designs.alternatives}</SectionLabel>
          <AlternativeList design={design} />
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionLabel>{sv.designs.savedVisualizations}</SectionLabel>
          {succeeded.length >= 2 ? (
            <Link
              href={`/designs/${design.id}/compare?a=${succeeded[0]!.id}&b=${succeeded[1]!.id}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ColumnsIcon />
              {sv.designs.compare}
            </Link>
          ) : null}
        </div>
        {design.visualizations.length === 0 ? (
          <EmptyState>{sv.designs.noVisualizations}</EmptyState>
        ) : (
          <VisualizationGrid visualizations={design.visualizations} />
        )}
      </section>

      <div className="mt-6">
        <DeleteDesignButton designId={design.id}>
          <Trash2Icon />
          {sv.designs.deleteRoom}
        </DeleteDesignButton>
      </div>
    </div>
  );
}

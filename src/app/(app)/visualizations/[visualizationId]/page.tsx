import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircleIcon, ColumnsIcon, DownloadIcon, LoaderCircleIcon, PenLineIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ComparisonSlider } from "@/features/visualizations/components/comparison-slider";
import { PendingPoller } from "@/features/visualizations/components/pending-poller";
import {
  AdjustVisualization,
  DeleteVisualizationButton,
} from "@/features/visualizations/components/visualization-actions";
import { getVisualization } from "@/features/visualizations/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";
import { formatDateTime } from "@/lib/utils";

// AI generation started from this page runs after the response (see generateVisualization).
export const maxDuration = 300;

export const metadata: Metadata = { title: sv.visualizations.title };

export default async function VisualizationPage({ params }: PageProps<"/visualizations/[visualizationId]">) {
  const { visualizationId } = await params;
  if (!isUuid(visualizationId)) notFound();
  const v = await getVisualization(visualizationId);
  if (!v) notFound();

  const aspectRatio = v.design.width && v.design.height ? v.design.width / v.design.height : 4 / 3;

  return (
    <div className="flex flex-col gap-5">
      <PendingPoller active={v.status === "pending"} />
      <PageHeader
        backHref={`/designs/${v.design.id}`}
        kicker={v.design.name}
        title={sv.visualizations.title}
        subtitle={`${v.alternative.name} · ${formatDateTime(v.createdAt)}`}
      />

      {v.status === "succeeded" && v.afterUrl && v.beforeUrl ? (
        <ComparisonSlider beforeUrl={v.beforeUrl} afterUrl={v.afterUrl} aspectRatio={aspectRatio} />
      ) : (
        <Card
          className="flex flex-col items-center justify-center gap-3 p-8 text-center"
          style={{ aspectRatio }}
          data-testid="visualization-status"
          data-status={v.status}
        >
          {v.status === "pending" ? (
            <>
              <LoaderCircleIcon className="size-10 animate-spin text-forest-900" />
              <p className="font-serif text-xl">{sv.editor.generating}</p>
              <p className="max-w-sm text-sm text-ink-600">{sv.visualizations.pendingHint}</p>
            </>
          ) : (
            <>
              <AlertCircleIcon className="size-10 text-red-700" />
              <p className="font-serif text-xl">{sv.visualizations.failed}</p>
              <p className="max-w-sm text-sm text-ink-600">{sv.visualizations.failedHint}</p>
            </>
          )}
        </Card>
      )}

      {v.instructions ? (
        <p className="text-sm text-ink-600">
          <span className="font-medium text-ink-900">{sv.visualizations.instructionsUsed}:</span> {v.instructions}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {v.status === "succeeded" ? (
          <a href={`/api/visualizations/${v.id}/download`} className={buttonVariants({ variant: "primary" })} download>
            <DownloadIcon />
            {sv.visualizations.export}
          </a>
        ) : null}
        {v.status !== "pending" ? (
          <AdjustVisualization alternativeId={v.alternative.id} instructions={v.instructions} />
        ) : null}
        <Link
          href={`/designs/${v.design.id}/editor?alt=${v.alternative.id}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          <PenLineIcon />
          {sv.visualizations.openDesign}
        </Link>
        {v.status === "succeeded" ? (
          <Link href={`/designs/${v.design.id}/compare?a=${v.id}`} className={buttonVariants({ variant: "secondary" })}>
            <ColumnsIcon />
            {sv.visualizations.compare}
          </Link>
        ) : null}
      </div>

      <div className="mt-6">
        <DeleteVisualizationButton visualizationId={v.id} />
      </div>
    </div>
  );
}

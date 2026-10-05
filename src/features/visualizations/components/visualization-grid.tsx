import Link from "next/link";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";
import { formatDateTime } from "@/lib/utils";
import type { DesignDetail } from "@/features/designs/queries";
import { PendingPoller } from "./pending-poller";

export function VisualizationGrid({ visualizations }: { visualizations: DesignDetail["visualizations"] }) {
  const anyPending = visualizations.some((v) => v.status === "pending");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <PendingPoller active={anyPending} />
      {visualizations.map((v) => (
        <Link
          key={v.id}
          href={`/visualizations/${v.id}`}
          className="group overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-lg"
          data-testid="visualization-card"
          data-status={v.status}
        >
          <div className="relative aspect-[4/3] bg-cream-200">
            {v.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <div className="flex size-full items-center justify-center text-ink-600">
                {v.status === "pending" ? (
                  <LoaderCircleIcon className="size-7 animate-spin" />
                ) : (
                  <AlertCircleIcon className="size-7 text-red-700" />
                )}
              </div>
            )}
            {v.status !== "succeeded" ? (
              <Badge tone={v.status === "pending" ? "attention" : "negative"} className="absolute top-2 left-2">
                {v.status === "pending" ? sv.visualizations.pending : sv.visualizations.failed}
              </Badge>
            ) : null}
          </div>
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{v.alternativeName}</p>
            <p className="truncate text-xs text-ink-600">{formatDateTime(v.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

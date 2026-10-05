"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmButton } from "@/components/confirm-button";
import { sv } from "@/lib/i18n/sv";
import { deleteVisualization } from "../actions";
import { GenerateForm } from "./generate-form";

export function AdjustVisualization({
  alternativeId,
  instructions,
}: {
  alternativeId: string;
  instructions: string | null;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <RefreshCwIcon />
          {sv.visualizations.adjust}
        </Button>
      </SheetTrigger>
      <SheetContent title={sv.visualizations.adjust}>
        <GenerateForm
          alternativeId={alternativeId}
          defaultInstructions={instructions ?? ""}
          submitLabel={sv.visualizations.adjust}
        />
      </SheetContent>
    </Sheet>
  );
}

export function DeleteVisualizationButton({ visualizationId }: { visualizationId: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title={sv.visualizations.deleteVisualization}
      variant="ghost"
      className="text-red-700"
      onConfirm={async () => {
        const result = await deleteVisualization(visualizationId);
        if (!result.ok) return void toast.error(result.error);
        router.push(`/designs/${result.data.designId}`);
      }}
    >
      <Trash2Icon />
      {sv.visualizations.deleteVisualization}
    </ConfirmButton>
  );
}

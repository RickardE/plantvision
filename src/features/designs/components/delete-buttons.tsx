"use client";

import { toast } from "sonner";
import { ConfirmButton } from "@/components/confirm-button";
import { sv } from "@/lib/i18n/sv";
import { deleteDesign, deleteProject } from "../actions";

/** Delete actions redirect on success, so only failures need handling here. */
export function DeleteProjectButton({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  return (
    <ConfirmButton
      title={sv.projects.deleteProject}
      variant="ghost"
      className="text-red-700"
      onConfirm={async () => {
        const result = await deleteProject(projectId);
        if (result && !result.ok) toast.error(result.error);
      }}
    >
      {children}
    </ConfirmButton>
  );
}

export function DeleteDesignButton({ designId, children }: { designId: string; children: React.ReactNode }) {
  return (
    <ConfirmButton
      title={sv.designs.deleteRoom}
      variant="ghost"
      className="text-red-700"
      onConfirm={async () => {
        const result = await deleteDesign(designId);
        if (result && !result.ok) toast.error(result.error);
      }}
    >
      {children}
    </ConfirmButton>
  );
}

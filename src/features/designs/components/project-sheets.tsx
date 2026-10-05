"use client";

import { PlusIcon } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { FormSheet } from "@/components/form-sheet";
import { sv } from "@/lib/i18n/sv";
import { createDesign, createProject, renameDesign, updateProject } from "../actions";

export function NewProjectCard() {
  return (
    <FormSheet
      title={sv.projects.newProject}
      submitLabel={sv.common.create}
      action={createProject}
      trigger={
        <button
          type="button"
          className="relative flex w-full items-center justify-between overflow-hidden rounded-[1.75rem] bg-forest-900 px-6 py-7 text-left text-cream-50 shadow-card transition-colors hover:bg-forest-800"
        >
          <span className="font-serif text-2xl">{sv.projects.newProject}</span>
          <span className="flex size-12 items-center justify-center rounded-full bg-coral-500 text-white">
            <PlusIcon className="size-6" />
          </span>
          <span aria-hidden className="absolute -top-10 -right-6 size-32 rounded-full bg-white/5" />
        </button>
      }
    >
      {(errors) => (
        <>
          <Field label={sv.projects.name} htmlFor="project-name" error={errors.name}>
            <Input
              id="project-name"
              name="name"
              placeholder={sv.projects.namePlaceholder}
              required
              maxLength={160}
              autoFocus
            />
          </Field>
          <Field label={sv.projects.customer} htmlFor="project-customer" hint={sv.common.optional}>
            <Input id="project-customer" name="customer_name" maxLength={160} />
          </Field>
        </>
      )}
    </FormSheet>
  );
}

export function EditProjectSheet({
  project,
  trigger,
}: {
  project: { id: string; name: string; customer_name: string | null };
  trigger: React.ReactNode;
}) {
  return (
    <FormSheet
      title={sv.common.edit}
      submitLabel={sv.common.save}
      action={updateProject.bind(null, project.id)}
      trigger={trigger}
    >
      {(errors) => (
        <>
          <Field label={sv.projects.name} htmlFor="edit-project-name" error={errors.name}>
            <Input id="edit-project-name" name="name" defaultValue={project.name} required maxLength={160} />
          </Field>
          <Field label={sv.projects.customer} htmlFor="edit-project-customer" hint={sv.common.optional}>
            <Input
              id="edit-project-customer"
              name="customer_name"
              defaultValue={project.customer_name ?? ""}
              maxLength={160}
            />
          </Field>
        </>
      )}
    </FormSheet>
  );
}

export function NewDesignSheet({ projectId, trigger }: { projectId: string; trigger: React.ReactNode }) {
  return (
    <FormSheet
      title={sv.designs.addRoom}
      submitLabel={sv.common.create}
      action={createDesign.bind(null, projectId)}
      trigger={trigger}
    >
      {(errors) => (
        <Field label={sv.designs.roomName} htmlFor="design-name" error={errors.name}>
          <Input
            id="design-name"
            name="name"
            placeholder={sv.designs.roomNamePlaceholder}
            required
            maxLength={160}
            autoFocus
          />
        </Field>
      )}
    </FormSheet>
  );
}

export function RenameDesignSheet({
  design,
  trigger,
}: {
  design: { id: string; name: string };
  trigger: React.ReactNode;
}) {
  return (
    <FormSheet
      title={sv.common.rename}
      submitLabel={sv.common.save}
      action={renameDesign.bind(null, design.id)}
      trigger={trigger}
    >
      {(errors) => (
        <Field label={sv.designs.roomName} htmlFor="rename-design" error={errors.name}>
          <Input id="rename-design" name="name" defaultValue={design.name} required maxLength={160} />
        </Field>
      )}
    </FormSheet>
  );
}

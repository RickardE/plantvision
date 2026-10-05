import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PencilIcon, PlusIcon, SproutIcon, Trash2Icon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionLabel } from "@/components/ui/card";
import { ListRow, Thumbnail } from "@/components/list-row";
import { DeleteProjectButton } from "@/features/designs/components/delete-buttons";
import { EditProjectSheet, NewDesignSheet } from "@/features/designs/components/project-sheets";
import { getProject } from "@/features/designs/queries";
import { isUuid } from "@/lib/ids";
import { sv } from "@/lib/i18n/sv";

export async function generateMetadata({ params }: PageProps<"/projects/[projectId]">): Promise<Metadata> {
  const { projectId } = await params;
  const project = isUuid(projectId) ? await getProject(projectId) : null;
  return { title: project?.name ?? sv.projects.title };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  if (!isUuid(projectId)) notFound();
  const project = await getProject(projectId);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        backHref="/projects"
        kicker={sv.projects.kicker}
        title={project.name}
        subtitle={project.customer_name ?? undefined}
        actions={
          <EditProjectSheet
            project={project}
            trigger={
              <Button variant="secondary" size="icon" aria-label={sv.common.edit}>
                <PencilIcon />
              </Button>
            }
          />
        }
      />

      <div className="flex items-center justify-between">
        <SectionLabel className="font-serif text-2xl tracking-tight text-ink-900 normal-case">
          {sv.designs.rooms}
        </SectionLabel>
        <NewDesignSheet
          projectId={project.id}
          trigger={
            <Button variant="link" className="px-0 text-coral-600">
              <PlusIcon />
              {sv.designs.addRoom}
            </Button>
          }
        />
      </div>

      {project.designs.length === 0 ? (
        <EmptyState>{sv.designs.noRooms}</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {project.designs.map((design) => (
            <ListRow
              key={design.id}
              href={`/designs/${design.id}`}
              title={design.name}
              subtitle={sv.designs.roomSummary(design.visualizationCount, design.hasImage)}
              thumbnail={
                <Thumbnail
                  src={design.thumbnailUrl}
                  fallback={<SproutIcon className="size-6 text-sage-400" strokeWidth={1.5} />}
                />
              }
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <DeleteProjectButton projectId={project.id}>
          <Trash2Icon />
          {sv.projects.deleteProject}
        </DeleteProjectButton>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { ListRow, Thumbnail } from "@/components/list-row";
import { requireUser } from "@/features/auth/session";
import { NewProjectCard } from "@/features/designs/components/project-sheets";
import { listProjects } from "@/features/designs/queries";
import { sv } from "@/lib/i18n/sv";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: sv.projects.title };

export default async function ProjectsPage() {
  const [user, projects] = await Promise.all([requireUser(), listProjects()]);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between pt-6 lg:pt-10">
        <p className="font-serif text-3xl text-forest-900">{sv.app.brand}</p>
        <Link
          href="/profile"
          aria-label={sv.nav.profile}
          className="flex size-11 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-cream-50 lg:hidden"
        >
          {initials(user.fullName || user.email)}
        </Link>
      </header>

      <NewProjectCard />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl">{sv.projects.title}</h1>
          <span className="text-sm text-ink-400">{sv.projects.count(projects.length)}</span>
        </div>
        {projects.length === 0 ? (
          <EmptyState>{sv.projects.empty}</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <ListRow
                key={project.id}
                href={`/projects/${project.id}`}
                title={project.name}
                subtitle={sv.projects.summary(project.roomCount, project.visualizationCount)}
                thumbnail={<Thumbnail src={project.coverUrl} fallback={<ImageIcon className="size-6" />} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

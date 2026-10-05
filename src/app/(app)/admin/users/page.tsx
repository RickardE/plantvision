import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/features/auth/session";
import { UserList } from "@/features/admin/components/user-list";
import { listTeamMembers } from "@/features/admin/queries";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.users };

export default async function UsersPage() {
  const user = await requireAdmin();
  const members = await listTeamMembers();
  return (
    <div className="max-w-3xl">
      <PageHeader backHref="/admin" kicker={sv.admin.title} title={sv.admin.users} />
      <UserList members={members} currentUserId={user.id} />
    </div>
  );
}

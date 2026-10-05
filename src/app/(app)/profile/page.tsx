import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, KeyRoundIcon, LogOutIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, SectionLabel } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { sv } from "@/lib/i18n/sv";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: sv.profile.title };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader kicker={sv.app.brand} title={sv.profile.title} />
      <Card className="flex items-center gap-4 p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-forest-900 text-lg font-semibold text-cream-50">
          {initials(user.fullName || user.email)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.fullName || user.email}</p>
          <p className="truncate text-sm text-ink-600">
            {sv.profile.roles[user.role]}, {sv.app.brand}
          </p>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionLabel>{sv.profile.account}</SectionLabel>
        <Card className="p-5">
          <p className="mb-3 text-sm text-ink-600">{user.email}</p>
          <ProfileForm fullName={user.fullName} />
        </Card>
      </section>

      <Card className="divide-y divide-cream-200">
        <Link href="/auth/update-password" className="flex items-center gap-3 px-5 py-4 hover:bg-cream-50">
          <KeyRoundIcon className="size-5 text-ink-600" />
          <span className="flex-1 font-medium">{sv.profile.changePassword}</span>
          <ChevronRightIcon className="size-4 text-ink-400" />
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-cream-50">
            <LogOutIcon className="size-5 text-ink-600" />
            <span className="flex-1 font-medium">{sv.auth.signOut}</span>
          </button>
        </form>
      </Card>
    </div>
  );
}

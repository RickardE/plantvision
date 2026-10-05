"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, SectionLabel } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { FormMessage } from "@/components/form-message";
import { sv } from "@/lib/i18n/sv";
import { formatDateTime, initials } from "@/lib/utils";
import { inviteUser, setUserDisabled, setUserRole } from "../user-actions";
import type { TeamMember } from "../queries";

export function UserList({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteState, inviteAction, invitePending] = useActionState(inviteUser, null);

  const run = (work: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <Card className="divide-y divide-cream-200">
        {members.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid="team-member">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-cream-50">
              {initials(member.fullName || member.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {member.fullName || member.email}
                {member.id === currentUserId ? <span className="text-ink-400"> ({sv.admin.you})</span> : null}
              </p>
              <p className="truncate text-xs text-ink-600">
                {member.email}
                {member.lastSignInAt ? ` · ${sv.admin.lastSignIn} ${formatDateTime(member.lastSignInAt)}` : ""}
              </p>
            </div>
            {member.invitedPending ? <Badge tone="attention">{sv.admin.invitePending}</Badge> : null}
            {member.disabled ? <Badge tone="negative">{sv.admin.disabled}</Badge> : null}
            <Select
              aria-label={sv.profile.role}
              value={member.role}
              disabled={pending}
              className="w-40"
              onChange={(e) => run(() => setUserRole(member.id, e.target.value as "admin" | "designer"))}
            >
              <option value="designer">{sv.profile.roles.designer}</option>
              <option value="admin">{sv.profile.roles.admin}</option>
            </Select>
            {member.id !== currentUserId ? (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => run(() => setUserDisabled(member.id, !member.disabled))}
              >
                {member.disabled ? sv.admin.enableUser : sv.admin.disableUser}
              </Button>
            ) : null}
          </div>
        ))}
      </Card>

      <section className="flex flex-col gap-3">
        <SectionLabel>{sv.admin.inviteUser}</SectionLabel>
        <Card className="p-5">
          <form action={inviteAction} className="grid gap-4 sm:grid-cols-2">
            <FormMessage state={inviteState} className="sm:col-span-2" />
            <Field
              label={sv.auth.email}
              htmlFor="invite-email"
              error={inviteState && !inviteState.ok ? inviteState.fieldErrors?.email : undefined}
            >
              <Input id="invite-email" name="email" type="email" required autoComplete="off" />
            </Field>
            <Field label={sv.profile.fullName} htmlFor="invite-name">
              <Input id="invite-name" name="full_name" maxLength={120} autoComplete="off" />
            </Field>
            <Field label={sv.profile.role} htmlFor="invite-role">
              <Select id="invite-role" name="role" defaultValue="designer">
                <option value="designer">{sv.profile.roles.designer}</option>
                <option value="admin">{sv.profile.roles.admin}</option>
              </Select>
            </Field>
            <Button type="submit" disabled={invitePending} className="self-end">
              {sv.admin.invite}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}

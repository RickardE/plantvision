import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, FileSpreadsheetIcon, ImagesIcon, LeafIcon, TagsIcon, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { sv } from "@/lib/i18n/sv";

export const metadata: Metadata = { title: sv.admin.title };

const links = [
  { href: "/admin/products", label: sv.admin.products, icon: LeafIcon },
  { href: "/admin/products/bulk", label: sv.admin.bulkImages, icon: ImagesIcon },
  { href: "/admin/products/import", label: sv.admin.importCsv, icon: FileSpreadsheetIcon },
  { href: "/admin/categories", label: sv.admin.categories, icon: TagsIcon },
  { href: "/admin/users", label: sv.admin.users, icon: UsersIcon },
];

export default function AdminPage() {
  return (
    <div className="max-w-xl">
      <PageHeader kicker={sv.app.brand} title={sv.admin.title} />
      <Card className="divide-y divide-cream-200">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-5 py-4 hover:bg-cream-50">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sage-100 text-forest-800">
              <Icon className="size-5" />
            </span>
            <span className="flex-1 font-medium">{label}</span>
            <ChevronRightIcon className="size-4 text-ink-400" />
          </Link>
        ))}
      </Card>
    </div>
  );
}

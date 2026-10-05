"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { sv } from "@/lib/i18n/sv";
import { deleteProduct, setProductStatus } from "../../actions";

export function ProductAdminActions({ productId, status }: { productId: string; status: "active" | "inactive" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = status === "active" ? "inactive" : "active";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setProductStatus(productId, next);
            if (!result.ok) toast.error(result.error);
            router.refresh();
          })
        }
      >
        {status === "active" ? <EyeOffIcon /> : <EyeIcon />}
        {status === "active" ? sv.admin.deactivate : sv.admin.activate}
      </Button>
      <ConfirmButton
        title={sv.admin.deleteProduct}
        variant="ghost"
        className="text-red-700"
        onConfirm={async () => {
          const result = await deleteProduct(productId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(result.message);
          router.push("/admin/products");
        }}
      >
        <Trash2Icon />
        {sv.admin.deleteProduct}
      </ConfirmButton>
    </div>
  );
}

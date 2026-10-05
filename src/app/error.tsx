"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sv } from "@/lib/i18n/sv";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-4xl">{sv.errors.generic}</h1>
      <p className="text-ink-600">{sv.common.unknownError}</p>
      <Button onClick={reset} className="mt-4">
        {sv.common.retry}
      </Button>
    </div>
  );
}

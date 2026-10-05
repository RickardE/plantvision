"use client";

import dynamic from "next/dynamic";
import { LoaderCircleIcon } from "lucide-react";
import type { DesignEditorProps } from "./design-editor";

// Konva needs the browser's canvas, so the editor is only rendered on the client.
const DesignEditor = dynamic(() => import("./design-editor").then((m) => m.DesignEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center">
      <LoaderCircleIcon className="size-8 animate-spin text-forest-900" />
    </div>
  ),
});

export function DesignEditorLoader(props: DesignEditorProps) {
  return <DesignEditor {...props} />;
}

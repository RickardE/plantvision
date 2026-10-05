"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { sv } from "@/lib/i18n/sv";
import { generateVisualization } from "../actions";

/**
 * Instruction field and "generate" button. `beforeGenerate` lets the editor flush unsaved
 * changes first, so the AI always sees the latest composition.
 */
export function GenerateForm({
  alternativeId,
  defaultInstructions = "",
  beforeGenerate,
  submitLabel = sv.editor.generate,
}: {
  alternativeId: string;
  defaultInstructions?: string;
  beforeGenerate?: () => Promise<boolean>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          if (beforeGenerate && !(await beforeGenerate())) return void toast.error(sv.editor.saveFailed);
          const result = await generateVisualization({ alternativeId, instructions });
          if (!result.ok) return void toast.error(result.error);
          router.push(`/visualizations/${result.data.id}`);
        });
      }}
    >
      <p className="text-sm text-ink-600">{sv.editor.generateIntro}</p>
      <Field label={sv.editor.instructions} htmlFor="ai-instructions" hint={sv.common.optional}>
        <Textarea
          id="ai-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={sv.editor.instructionsPlaceholder}
          maxLength={1000}
        />
      </Field>
      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        <SparklesIcon />
        {pending ? sv.editor.generating : submitLabel}
      </Button>
    </form>
  );
}

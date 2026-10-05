import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/actions/result";

/** Shows the top-level result of a form submission (success message or error). */
export function FormMessage({
  state,
  fallbackError,
  className,
}: {
  state: FormState<unknown>;
  fallbackError?: string;
  className?: string;
}) {
  const error = state && !state.ok ? state.error : fallbackError;
  const message = state?.ok ? state.message : undefined;
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm",
        error ? "bg-red-50 text-red-800" : "bg-sage-100 text-forest-800",
        className,
      )}
    >
      {error ?? message}
    </p>
  );
}

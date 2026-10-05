import { z } from "zod";
import { sv } from "@/lib/i18n/sv";

/** Every Server Action returns this shape so forms can show errors consistently. */
export type ActionResult<T = undefined> =
  { ok: true; data: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type FormState<T = undefined> = ActionResult<T> | null;

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string>,
): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors };
}

export function validationFailure(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fail(sv.common.invalidInput, fieldErrors);
}

/** Postgres error codes we translate into user-facing messages. */
export const PG = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
  insufficientPrivilege: "42501",
} as const;

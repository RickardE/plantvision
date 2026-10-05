/**
 * Only allow redirects to paths inside the app, never to another origin. Rejects protocol-relative
 * (`//host`) and backslash (`/\host`, which browsers treat like `//`) forms.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/projects") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

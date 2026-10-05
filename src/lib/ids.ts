const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params are user input; checking the shape first turns bad links into 404s, not 500s. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

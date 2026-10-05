<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PlantVision conventions

Read `docs/implementation-plan.md` (architecture) and `docs/decisions.md` (why things are the way they are) before larger changes.

## Structure

- `src/app` holds routes only. Pages load data through a feature's `queries.ts` and change data through its `actions.ts` (Server Actions). Keep pages thin.
- `src/features/<feature>` owns its queries, actions, Zod schemas, components and tests. Other features may use its top-level modules (`queries.ts`, `images.ts`, `status.ts`, `components/`), never its internals.
- Code used by several features lives in `src/lib`. UI primitives live in `src/components/ui`.
- Files with `"use server"` export async functions only. Server-only modules start with `import "server-only"`.

## Rules

- **All user-facing text goes in `src/lib/i18n/sv.ts`.** No Swedish strings in components.
- **Every Server Action** parses input with Zod, gets a Supabase client for the signed-in user, and returns `ActionResult`/`FormState` from `src/lib/actions/result.ts`. Use `revalidatePath` for pages it affects.
- **Security is in the database.** Every table and bucket has RLS; add policies and a pgTAP test in `supabase/tests` for any new table. Use the admin (secret key) client only for things RLS cannot express (inviting users, background AI jobs), and never import it into client code.
- **Schema changes**: new migration file (`pnpm exec supabase migration new <name>`), never edit an applied one; then `pnpm db:reset && pnpm db:types`.
- **Placements** are fractions of the room image; use `src/lib/images/placement.ts` so the canvas and the server composition stay identical.
- **AI providers** implement `ImageGenerationProvider` in `src/lib/ai`. Tests and local development use the mock provider; never call a paid API from tests.
- Mobile first: design for a 375 px wide screen, then add `sm:`/`lg:` styles. Touch targets at least 44 px.

## Before pushing

`pnpm check` (format, lint, types, unit tests). For changes to data access or flows, also `pnpm test:db` and `pnpm build && pnpm test:e2e`. Add or update tests with every behaviour change.

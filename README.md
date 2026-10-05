# PlantVision

An AI workspace for Terraplants' plant designers: browse the product library, place plants and pots on a photo of the customer's room, and turn the composition into a photorealistic visualization during the customer meeting. Mobile first, and it works on desktop too.

- **Plan the build followed:** [`docs/implementation-plan.md`](docs/implementation-plan.md)
- **Decisions to review:** [`docs/decisions.md`](docs/decisions.md)
- **Going live and running it:** [`docs/operations.md`](docs/operations.md)

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Supabase (Auth, Postgres with RLS, Storage) · Tailwind CSS 4 · Radix · Konva · sharp · Zod · Vitest · pgTAP · Playwright · pnpm.

## Getting started

Requirements: Node 22, pnpm 10, Docker (for local Supabase).

```bash
pnpm install
cp .env.example .env.local   # local defaults work as is; AI_PROVIDER=mock needs no key
pnpm db:start                # local Supabase (Postgres, Auth, Storage)
pnpm db:reset                # applies migrations and seed users
pnpm seed:demo               # a few illustrated demo products with images
pnpm dev                     # http://localhost:3000
```

Sign in with `admin@plantvision.test` or `designer@plantvision.test`, password `plantvision-dev`.

To load the real catalogue: `pnpm import:products path/to/Clarius.csv path/to/NoviFlora.csv` (or Admin → Importera leverantörsfil).

To try real AI generation locally, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` in `.env.local`.

## Scripts

| Command                        | What it does                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Run, build, serve                                                                                         |
| `pnpm check`                   | Format check, lint, typecheck, unit tests (run before pushing)                                            |
| `pnpm test`                    | Unit tests (Vitest)                                                                                       |
| `pnpm test:db`                 | Row Level Security tests (pgTAP, needs local Supabase)                                                    |
| `pnpm test:e2e`                | End-to-end tests on phone and desktop viewports (needs `pnpm build`, local Supabase and `pnpm seed:demo`) |
| `pnpm db:types`                | Regenerate `src/lib/supabase/database.types.ts` after a migration                                         |
| `pnpm format`                  | Format everything with Prettier                                                                           |

## Project layout

```text
src/app/          Routes only (pages, layouts, route handlers). Thin.
src/features/     One folder per domain: auth, products, admin, designs, visualizations.
                  Each holds its queries, server actions, schemas, components and tests.
src/lib/          Shared code: Supabase clients, env, AI providers, image geometry and
                  processing, storage helpers, Swedish UI strings (i18n/sv.ts), utilities.
src/components/   UI primitives (ui/) and app layout.
supabase/         Migrations (schema, RLS, storage), seed, pgTAP tests, email templates.
e2e/              Playwright tests.
scripts/          CLI: supplier import, demo seed.
docs/             Plan, decisions, operations.
```

Conventions for contributors (human or AI) are in [`AGENTS.md`](AGENTS.md).
# plantvision

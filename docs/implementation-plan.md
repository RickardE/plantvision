# PlantVision – Implementation Plan

This is the plan the MVP was built from. It follows the requirement specification (v5) and uses the mobile design deck as visual inspiration. Where the plan deviates from, or adds to, the specification, the reason is written next to it and repeated in [`decisions.md`](./decisions.md).

## 1. Goals and constraints

- **Small team, maintained with AI assistance.** Few moving parts, mainstream libraries with large training corpora, strict types end to end, conventions written down in `CLAUDE.md`/`AGENTS.md` so an assistant can follow them.
- **Mobile first.** Every screen is designed for a 375 px wide phone first and then widened. The design canvas works with touch (drag, handles for resize/rotate) as well as mouse.
- **Production ready.** Row Level Security on every table, validated input on every server boundary, migrations in source control, automated tests at three levels, CI on every push.
- **Pragmatic.** One Next.js application, one Supabase project, one AI integration. No CMS, no queues, no microservices.

## 2. Tech stack

| Concern             | Choice                                                                                 | Why                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Language            | TypeScript (strict)                                                                    | One language front to back, types generated from the database.                                        |
| App framework       | Next.js 16 (App Router, React 19, Server Components, Server Actions)                   | Spec's preferred architecture. Server Actions remove the need for a hand-written API layer for forms. |
| Backend platform    | Supabase (Auth, Postgres, Storage) via `@supabase/ssr`                                 | Spec's preferred backend. Managed auth, RLS and storage in one place.                                 |
| Database access     | `supabase-js` with generated `Database` types                                          | No ORM to learn or keep in sync; RLS applies automatically because queries run as the signed-in user. |
| Migrations          | Supabase CLI (`supabase/migrations/*.sql`)                                             | Plain SQL, reviewed in PRs, same tool for local and hosted.                                           |
| Styling             | Tailwind CSS 4 + a small set of own UI primitives built on Radix                       | Utility CSS is easy for AI tools to edit safely; Radix gives accessible dialogs, sheets and menus.    |
| Forms / validation  | Zod schemas shared by client and server                                                | One schema per input, reused in Server Actions and the CSV importer.                                  |
| Design canvas       | Konva via `react-konva`                                                                | Proven 2D canvas with built-in transformer (move / resize / rotate), touch support and image export.  |
| Image processing    | `sharp` (server)                                                                       | Builds the flattened composition sent to the AI and normalises uploaded images.                       |
| AI image generation | Provider interface with a Google Gemini image implementation and a deterministic mock  | Provider is swappable by environment variable; tests and local development never call a paid API.     |
| Unit tests          | Vitest                                                                                 | Fast, ESM native, same config style as the app.                                                       |
| Database tests      | pgTAP via `supabase test db`                                                           | Proves RLS rules, not just the app's use of them.                                                     |
| End-to-end tests    | Playwright (phone + desktop projects) against local Supabase with the mock AI provider | Exercises the real stack including auth, storage and RLS.                                             |
| Lint / format       | ESLint (next config) + Prettier                                                        | Standard, auto-fixable.                                                                               |
| CI                  | GitHub Actions                                                                         | Lint, typecheck, unit, DB and e2e tests on every push and PR.                                         |
| Hosting (suggested) | Vercel + Supabase Cloud (EU region)                                                    | Zero-ops hosting for both halves; see decisions.                                                      |
| Package manager     | pnpm                                                                                   | Fast, strict dependency resolution.                                                                   |

**Repository shape.** A single Next.js app in one repository, not a monorepo. There is exactly one deployable and no shared packages, so workspaces would add configuration without benefit. The code is organised by feature inside `src/` so it can be split later if a second app appears.

## 3. Code structure

```text
src/
  app/                    Routes only: layouts, pages, route handlers. Thin.
    (auth)/               Login, password reset, invite acceptance.
    (app)/                Signed-in shell with bottom tab bar (mobile) / sidebar (desktop).
      projects/           Kundprojekt → rum (design) → alternativ → visualiseringar.
      products/           Product library (browse, search, filter, detail).
      admin/              Product, category and user administration (admins only).
      profile/
    api/                  Route handlers that must stream binary data (images, exports).
  features/               One folder per domain feature. Each holds its server actions,
    products/             queries, schemas, components and tests together.
    designs/
    visualizations/
    admin/
    auth/
  lib/                    Cross-cutting code: supabase clients, env parsing, ai providers,
                          image helpers, i18n strings, utilities.
  components/ui/          Design-system primitives (Button, Input, Sheet, Card …).
supabase/
  migrations/             SQL schema, RLS policies, storage buckets.
  tests/                  pgTAP tests.
  seed.sql                Local dev users and categories.
scripts/                  CLI tools (supplier CSV import).
e2e/                      Playwright tests.
docs/                     This plan, decisions, operations guide.
```

Rules that keep it maintainable:

1. Pages fetch data through feature `queries.ts` functions and mutate through feature `actions.ts` Server Actions. Components never talk to Supabase directly except the browser upload helper.
2. Every Server Action validates input with Zod, checks the user, and returns a typed `ActionResult`.
3. Authorisation lives in the database (RLS). Application checks are for good error messages, not security.
4. UI strings live in one Swedish dictionary (`src/lib/i18n/sv.ts`) so wording changes, or a second language, never touch components.
5. Features use each other only through their top-level modules (`queries.ts`, `images.ts`, `status.ts`, `components/`), never through internals such as editor state; code needed by several features moves to `lib/`.

## 4. Data model

```text
profiles(id → auth.users, full_name, role: admin|designer)
categories(id, slug, name, kind: plant|pot|accessory|other, sort_order)
products(id, category_id, article_number UNIQUE, name, botanical_name, description,
         supplier, status: active|inactive, width_cm, depth_cm, height_cm, size_label,
         color, light_requirement: low|medium|high, price_sek, metadata jsonb,
         search_text (generated, trigram-indexed), timestamps, created_by)
product_images(id, product_id, storage_path | external_url, position, alt)

projects(id, name, customer_name, created_by, timestamps)           ← "Kundprojekt"
designs(id, project_id, name, environment_image_path, image_width, image_height)  ← "Rum"
design_alternatives(id, design_id, name, position)                  ← "Alternativ A/B/…"
design_items(id, alternative_id, product_id, x, y, width, rotation, flip_x, z_index)
visualizations(id, alternative_id, status: pending|succeeded|failed, composite_path,
               result_path, instructions, prompt, provider, model, error, timestamps)
```

- Placement is stored **normalised to the environment image** (x, y, width as 0–1 fractions, rotation in degrees). A design looks the same on a phone and a 4K screen and the server can rebuild it at full resolution.
- Customer projects group designs because the design deck shows it (Kundprojekt → Rum). The spec's "design" is the room; "design alternatives" hang under it.
- Products are soft-deleted by setting `status = inactive`; hard delete is allowed only when no design uses the product (enforced by a foreign key `ON DELETE RESTRICT`).

**Access rules (RLS)**

- Everyone must be signed in. There is no public sign-up; admins invite users.
- All signed-in users read active products and categories. Admins read and write everything in the product library.
- Projects, designs, alternatives, items and visualizations are shared by the whole team (small company, shared customer work). Any signed-in user can read and edit them.
- Storage: `product-images` is publicly readable (catalogue photos, CDN-cacheable) and admin-writable. `environment-images` and `visualizations` are private; signed-in users access them through short-lived signed URLs.

## 5. Phase 1 – Product library

1. Migrations for categories, products, images, profiles, roles, RLS, storage buckets, search index (`pg_trgm` on a generated text of name, article number, botanical name, colour and supplier).
2. Library screen: search box, category chips (Alla / Växter / Krukor / …), filter sheet (light, height range, width range, colour, supplier), infinite list of product cards, product detail page with image gallery and metadata.
3. Admin:
   - Product list with status filter and quick activate/deactivate.
   - Create/edit form with image upload (multiple images, choose the main image, remove).
   - **Bulk add by images**: pick many images; each becomes a draft product named from the file name, then edited in place.
   - **Supplier CSV import**: upload a file in the supplier format (as supplied for Clarius and NoviFlora), preview counts and problems, then import (upsert on article number). The same parser powers `pnpm import:products` for large loads.
   - Categories: create, rename, reorder.
   - Users: invite by email, change role, deactivate.
4. Auth: email + password, password reset, invite acceptance, sign-out, profile page.

## 6. Phase 2 – Design & AI visualisation

1. Projects list (dashboard) → project page with rooms → room page with environment image upload (camera or file) and saved visualisations.
2. Design editor (full-screen on phone):
   - Konva stage fitted to the screen, environment image as background.
   - Product picker in a bottom sheet (phone) or side panel (desktop) with search and category chips; tap to add, or drag from the picker onto the canvas on desktop. New items start at a size derived from their real height, and a plant added while a pot is selected (or the reverse) is placed in/under it.
   - Select item → transformer handles for resize and rotate; toolbar for duplicate, flip, bring forward/back, delete.
   - Alternatives as tabs; "new alternative" copies the current one.
   - Autosave (debounced) with visible "Sparat" state; explicit save on leave.
3. AI visualisation:
   - Server builds a flattened composite with `sharp` from the saved placement (single source of truth, not a client screenshot).
   - A prompt builder turns the placement into precise text: each product's name, real dimensions, position, relative size and rotation, plus the rules from the spec (preserve room, perspective, furniture, placement; adapt lighting; photorealistic; do not add or remove products). The designer can add an extra instruction.
   - The provider receives the room image, the composite and each product's reference image.
   - Generation runs after the response (`after()`), status is polled; failures are stored and shown with a retry.
   - Results are stored in Storage and linked to the alternative.
4. Result handling: before/after slider, compare any two visualisations side by side (across alternatives), download as JPEG, export the plain composition too.

## 7. Quality plan

- **Unit tests**: CSV parser and dimension parsing on real supplier rows, prompt builder, geometry/normalisation, Zod schemas, composite builder.
- **Database tests**: pgTAP for RLS (designer cannot write products, anonymous reads nothing, private buckets, etc.).
- **E2E tests** on phone and desktop viewports: sign-in, library search/filter, admin create/edit/deactivate with image, CSV import, project → room → upload → place → generate (mock) → compare → export.
- **Continuous review**: after each feature, re-read the diff for structure (feature boundaries, duplication, naming) before moving on. A final fresh review of the whole codebase, with fixes.
- **CI** runs everything on each push.

**Result at hand-over:** 57 unit tests, 24 pgTAP tests and 26 end-to-end tests (13 scenarios, each on a phone and a desktop viewport) pass locally; CI runs the same suites.

## 8. Going live (needs owner action)

1. Create a Supabase project (EU region), run migrations with `supabase db push`, set Auth site URL and email templates, disable public sign-ups.
2. Create an AI provider API key.
3. Create the Vercel project, set environment variables from `.env.example`.
4. Invite the first admin, import the supplier CSVs.

See `docs/operations.md` for the step-by-step guide.

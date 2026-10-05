# Operations guide

How to take PlantVision live and keep it running. Steps marked **owner** need accounts or decisions only the business owner can make.

## 1. Accounts to create (owner)

1. **Supabase**: create a project in an EU region (e.g. `eu-north-1` Stockholm). Note the project ref, the database password, the project URL and, under Project Settings → API Keys, the _publishable_ and _secret_ keys.
2. **Google AI Studio / Vertex AI**: create an API key with access to the Gemini image model. Set a monthly budget alert.
3. **Vercel** (or another Node host): create a project connected to the GitHub repository.
4. **Email sending**: Supabase's built-in email is rate-limited and only for testing. Configure a custom SMTP provider (Resend, Postmark, SendGrid …) under Authentication → Emails → SMTP Settings so invites and password resets reach people.

## 2. Configure Supabase

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase db push          # applies supabase/migrations
```

In the Supabase dashboard:

- **Authentication → Sign In / Providers**: turn _Allow new users to sign up_ **off** (invite only). Keep email provider on, _Confirm email_ on.
- **Authentication → URL Configuration**: Site URL = the production URL (e.g. `https://plantvision.terraplants.se`). Add `https://<production-domain>/**` and your Vercel preview pattern to the redirect URLs.
- **Authentication → Email Templates**: copy `supabase/templates/invite.html` and `recovery.html` into the _Invite user_ and _Reset password_ templates. They link to `/auth/confirm`, which the app handles.
- **Storage**: the migration creates the buckets and their policies; nothing to do.

## 3. Configure the app (Vercel → Settings → Environment Variables)

| Variable                               | Value                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key                                        |
| `SUPABASE_SECRET_KEY`                  | secret key (server only, never exposed to the browser) |
| `NEXT_PUBLIC_SITE_URL`                 | production URL                                         |
| `AI_PROVIDER`                          | `gemini`                                               |
| `GEMINI_API_KEY`                       | the API key                                            |
| `GEMINI_IMAGE_MODEL`                   | optional, defaults to `gemini-2.5-flash-image`         |

The app validates these at start-up and refuses to run with a missing or malformed value. Pick the Vercel region closest to the Supabase region (e.g. `arn1` Stockholm).

## 4. First run (owner)

1. Create the first admin: in Supabase → Authentication → Users → _Invite user_, then in the SQL editor:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'you@company.se';
   update public.profiles set role = 'admin' where email = 'you@company.se';
   ```
   Everyone else is invited from **Admin → Användare** inside the app.
2. Import the supplier files: **Admin → Importera leverantörsfil** (preview first), or for the full lists from a laptop:
   ```bash
   # .env.local pointing at production (URL + secret key)
   pnpm import:products path/to/Clarius.csv
   pnpm import:products path/to/NoviFlora.csv
   ```
3. Check a few products, set light requirements and descriptions where useful, deactivate what should not be offered.

## 5. Day-to-day

- **Monthly price lists**: re-import the supplier file. Existing articles are updated (name, size, colour, price, supplier image); manual edits to status, light, description and uploaded images are kept.
- **New users / leavers**: Admin → Användare. Disabling a user blocks new sign-ins immediately and keeps their work; a session already open on a device ends when its access token expires (at most one hour, the Supabase default).
- **Failed visualizations**: the page shows the failure and offers _Justera och skapa ny_. The technical error is stored in `visualizations.error` for debugging.

## 6. Monitoring and costs

- **Vercel → Logs**: server errors, including `Visualization failed <id>` lines from the AI job.
- **Supabase → Reports**: database size, storage use, auth events.
- **AI cost** is per generated image. Each visualization is one request. The budget alert from step 1 is the safety net.
- **Backups**: Supabase takes daily database backups on paid plans. Storage objects (room photos, results) are not in those backups; enable Point-in-Time Recovery or a periodic bucket copy if they must survive a mistaken deletion.

## 7. Releasing changes

1. Open a pull request; CI runs formatting, lint, types, unit tests, pgTAP (RLS) tests and the end-to-end suite on phone and desktop viewports.
2. Merge to `main`; Vercel deploys.
3. Database changes: add a new file with `pnpm exec supabase migration new <name>`, test locally with `pnpm db:reset`, regenerate types with `pnpm db:types`, and after merging run `pnpm exec supabase db push` against production (or wire it into a deploy workflow once the team is comfortable).

## 8. Local development

See the README.

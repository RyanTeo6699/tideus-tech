# Tideus

Tideus is being repositioned into an AI-powered case workspace for high-frequency, rules-relatively-clear, document-heavy Canada temporary resident application and extension prep.

The current wedge focus is intentionally narrow:

- Visitor Record
- Study Permit Extension

The product is not positioned as a broad immigration platform, a generic chatbot, or a replacement for licensed professional advice.

## Product Direction

The workflow is case-first:

1. Choose a supported use case
2. Complete a narrow intake
3. Mark expected materials
4. Generate a structured review output
5. Save and resume the case from the dashboard

The review output is structured around:

- readiness status
- checklist
- missing items
- risk flags
- timeline note
- next steps

## Current App Surfaces

Public:

- Home
- How It Works
- Use Cases
- Use Case detail pages
- Start a Case
- Trust & Boundaries
- Book Demo
- Privacy
- Terms

Protected:

- Case Dashboard
- Case list
- Case detail
- Case intake
- Upload Materials
- Review Results
- Profile

Legacy protected records are still preserved for:

- assessments
- comparisons
- Copilot threads

These older records are no longer the primary product surface.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Supabase Auth
- Supabase Postgres
- OpenAI dependency installed for future structured assist flows
- Vercel-ready app router structure

## Project Structure

```text
app/
  (auth)/
  (dashboard)/
  (marketing)/
  api/
  auth/
components/
  cases/
  copilot/
  dashboard/
  forms/
  profile/
  site/
  ui/
lib/
  case-review.ts
  case-workflows.ts
  cases.ts
  dashboard.ts
  history.ts
  profile.ts
  supabase/
supabase/
  migrations/
proxy.ts
```

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_APP_URL`: App base URL such as `http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key

Optional:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## Supabase Setup

1. Create a Supabase project.
2. Copy the Supabase project URL and publishable key into `.env.local`.
3. Apply these SQL files in order:
   - `supabase/migrations/202603300001_sprint_2_foundation.sql`
   - `supabase/migrations/202603300002_sprint_3_workflows.sql`
   - `supabase/migrations/202603310001_sprint_4_profile_expansion.sql`
   - `supabase/migrations/202603310002_sprint_6_case_workspace.sql`
4. In Supabase Auth, enable Email/Password sign-in.
5. If email confirmation is enabled, the app already supports the `/auth/callback` route.

## Database Notes

The active wedge workflow now centers on these entities:

- `cases`
- `case_documents`
- `case_review_versions`

Existing entities still present:

- `profiles`
- `assessments`
- `comparisons`
- `copilot_threads`
- `copilot_messages`

`cases` stores:

- use case slug
- case status
- intake answers
- latest review snapshot fields
- checklist state
- status history
- metadata hooks for exports and tracking

`case_documents` stores:

- expected document records per case
- document status
- material reference
- notes

`case_review_versions` stores:

- readiness status
- readiness summary
- result summary
- timeline note
- checklist items
- missing items
- risk flags
- next steps

## Local Development

1. Install Node.js 22 or newer.
2. Install dependencies:

```bash
npm install
```

3. Add `.env.local` with your Supabase values.
4. Apply the database migrations in Supabase.
5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

## Verification

Run:

```bash
npm run typecheck
npm run build
```

## Trust Boundary

Tideus is not a law firm, government service, or licensed representative. The product is designed to help users organize supported case prep workflows and produce structured review-ready outputs before the next professional step.

## Recommended Next Sprint

Tighten the wedge instead of widening it:

- add richer document-state rules per supported use case
- improve the quality of review version comparisons
- add export-ready package summaries for professional handoff
- add lightweight file upload or storage integration only for the existing wedge workflows

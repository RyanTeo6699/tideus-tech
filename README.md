# Tideus

Tideus is a case-first workflow workspace for high-frequency, document-heavy Canada temporary resident application and extension preparation.

The current wedge is intentionally narrow:

- Visitor Record
- Study Permit Extension

Tideus is not positioned as:

- a generic immigration chatbot
- a broad immigration platform
- a legal advice service
- a tool menu organized around assessments, comparisons, or Copilot threads

## Product Model

The primary product flow is:

1. Choose a supported workflow
2. Create or resume a case
3. Complete the intake
4. Update expected materials
5. Generate a structured review output
6. Save and continue the case from the dashboard

The review output is intentionally structured:

- readiness status
- checklist
- missing items
- risk flags
- timeline note
- next steps

## Current Surfaces

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

Legacy records are still preserved behind authenticated archive pages for migration continuity:

- assessment records
- comparison records
- assistant threads

Those legacy surfaces are secondary and no longer represent the primary product journey.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Supabase Auth
- Supabase Postgres
- OpenAI dependency installed for future narrow structured assist flows
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
  case-events.ts
  case-review.ts
  case-state.ts
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

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

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
   - `supabase/migrations/202603310003_sprint_6_case_events.sql`
4. In Supabase Auth, enable Email/Password sign-in.
5. If email confirmation is enabled, the app supports the `/auth/callback` route.

## Core Tables

Primary wedge tables:

- `cases`
- `case_documents`
- `case_review_versions`
- `case_events`

Supporting tables:

- `profiles`

Legacy archived tables:

- `assessments`
- `comparisons`
- `copilot_threads`
- `copilot_messages`

## Case Lifecycle

The case status machine is centralized and explicit:

- `draft`
- `intake-complete`
- `materials-updated`
- `reviewed`

The current workflow transitions are:

- create case -> `draft`
- complete intake -> `intake-complete`
- update materials -> `materials-updated`
- generate or regenerate review -> `reviewed`

## Workflow Event Capture

Tideus now stores structured `case_events` for future moat and funnel analysis.

Current event types:

- `case_created`
- `intake_started`
- `intake_completed`
- `materials_updated`
- `review_generated`
- `review_regenerated`
- `case_resumed`

No analytics UI is shipped in this sprint. The goal is clean data capture around the actual workflow.

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

Tideus is not a law firm, government service, or licensed representative. The product is designed to help users organize narrow case prep workflows, produce structured review-ready outputs, and carry workflow history into a later professional step.

## Recommended Next Sprint

Stay narrow and tighten the wedge:

- add export-ready case summary packets for professional handoff
- add richer case-event metadata hooks around exports and handoffs
- improve document-specific readiness rules for the two supported workflows only

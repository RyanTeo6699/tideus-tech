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

## Launch-Readiness Scope

This branch is aimed at early-access launch readiness, not product expansion.

The current launch-ready additions are:

- real case-material uploads backed by Supabase Storage
- export-ready review summaries through a print/PDF-friendly page
- persistent demo / early-access lead capture
- measurable launch funnel event capture

The current conversion and handoff focus is:

- a stronger export-ready summary packet for professional discussion
- clearer next-action and review-state scanability inside the case workspace
- richer structured event metadata for future analysis

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

Launch surfaces also include:

- a private case-material upload flow
- a print/export-friendly review summary at `/review-results/[caseId]/export`
- a live Book Demo / Early Access form at `/book-demo`
- a handoff-style summary packet that can be printed or saved for later review

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
- Review Export
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
  app-events.ts
  case-files.ts
  case-events.ts
  case-review.ts
  case-state.ts
  case-workflows.ts
  cases.ts
  dashboard.ts
  history.ts
  lead-requests.ts
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

No new environment variables were required for this launch-readiness sprint. Storage, lead capture, and export routing all use the existing Supabase and app configuration.

## Supabase Setup

1. Create a Supabase project.
2. Copy the Supabase project URL and publishable key into `.env.local`.
3. Apply these SQL files in order:
   - `supabase/migrations/202603300001_sprint_2_foundation.sql`
   - `supabase/migrations/202603300002_sprint_3_workflows.sql`
   - `supabase/migrations/202603310001_sprint_4_profile_expansion.sql`
   - `supabase/migrations/202603310002_sprint_6_case_workspace.sql`
   - `supabase/migrations/202603310003_sprint_6_case_events.sql`
   - `supabase/migrations/202603310004_sprint_7_launch_readiness.sql`
4. In Supabase Auth, enable Email/Password sign-in.
5. If email confirmation is enabled, the app supports the `/auth/callback` route.

## Storage Setup

The launch-readiness migration creates a private Supabase Storage bucket named `case-materials`.

Expected storage behavior:

- files are stored under `userId/caseId/documentId/...`
- only the authenticated owner can read, write, replace, or delete objects in their folder
- current upload validation allows:
  - PDF
  - PNG
  - JPEG
  - WEBP
- current per-file limit: 10 MB

The app stores related file metadata in `case_documents`:

- `storage_bucket`
- `storage_path`
- `file_name`
- `file_size_bytes`
- `mime_type`
- `uploaded_at`

## Core Tables

Primary wedge tables:

- `cases`
- `case_documents`
- `case_review_versions`
- `case_events`
- `lead_requests`
- `app_events`

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

## Launch Funnel Event Capture

Launch-readiness also adds `app_events` for public and conversion-path telemetry.

Current app event types:

- `landing_cta_clicked`
- `start_case_selected`
- `book_demo_clicked`
- `early_access_requested`
- `export_clicked`

These events are intentionally narrow and support early launch analysis without shipping an analytics dashboard.

Current metadata now includes workflow-relevant detail where available, such as:

- review readiness and item counts on review generation
- changed-material counts on materials updates
- use case and readiness state on export clicks
- source-surface context on demo and CTA clicks

## Lead Capture

`/book-demo` now persists lead submissions in `lead_requests`.

Captured fields:

- `email`
- `use_case_interest`
- `current_stage`
- `wants_demo`
- `wants_early_access`
- `note`

This keeps the early-access path usable without adding a broad CRM or admin system.

## Export Flow

The latest saved review can be opened at:

- `/review-results/[caseId]`
- `/review-results/[caseId]/export`

The export page is print-friendly so users can save a clean PDF from the browser now, while leaving room for true server-side PDF generation later.
It is structured as a credible handoff artifact with the latest readiness snapshot, key case facts, checklist and risk summaries, next actions, and an explicit trust footer.

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

Run these in order:

```bash
npm install
npm run typecheck
npm run build
```

Note: run `npm run typecheck` and `npm run build` serially, not in parallel, because both touch generated `.next` artifacts.

## Trust Boundary

Tideus is not a law firm, government service, or licensed representative. The product is designed to help users organize narrow case prep workflows, produce structured review-ready outputs, and carry workflow history into a later professional step.

## Recommended Next Sprint

Stay narrow and tighten the wedge:

- add export-ready summary packets for professional handoff
- add richer app-event and case-event metadata around exports and follow-up actions
- improve document-specific readiness rules for Visitor Record and Study Permit Extension only

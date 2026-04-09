# Tideus

Tideus is a case-first workflow workspace for high-frequency, document-heavy Canada temporary resident application and extension preparation.

The current wedge is intentionally narrow:

- Visitor Record
- Study Permit Extension

Tideus is not positioned as:

- a broad immigration platform
- a generic immigration chatbot
- a legal advice service
- a tool menu centered on assessments, comparisons, or Copilot threads

## Current Product Shape

This branch is an early-access wedge workflow MVP with a stronger conversion and handoff path.

Primary product flow:

1. Choose a supported workflow
2. Create or resume a case
3. Complete the intake
4. Update expected materials
5. Generate a structured review output
6. Save, resume, export, or discuss the latest review packet

Structured review output stays narrow and repeatable:

- readiness status
- checklist
- missing items
- risk flags
- timeline note
- next steps

The current handoff and conversion surfaces include:

- a private case-material upload flow
- a saved case workspace
- a print/export-friendly review packet at `/review-results/[caseId]/export`
- a Book Demo / Early Access flow at `/book-demo`
- structured case events and app events for future funnel analysis

## Active Surface Map

Public:

- `/`
- `/how-it-works`
- `/use-cases`
- `/use-cases/[slug]`
- `/start-case`
- `/book-demo`
- `/trust`
- `/privacy`
- `/terms`

Protected:

- `/dashboard`
- `/dashboard/cases`
- `/dashboard/cases/[caseId]`
- `/case-intake?useCase=...`
- `/upload-materials/[caseId]`
- `/review-results/[caseId]`
- `/review-results/[caseId]/export`
- `/dashboard/profile`

Primary APIs:

- `/api/cases`
- `/api/cases/[caseId]/documents`
- `/api/cases/[caseId]/documents/[documentId]/upload`
- `/api/cases/[caseId]/review`
- `/api/events`
- `/api/lead-requests`
- `/api/profile`

## Case-First Architecture

Primary app areas:

```text
app/
  (marketing)/
    page.tsx
    how-it-works/
    use-cases/
    start-case/
    book-demo/
    trust/
    privacy/
    terms/
  (dashboard)/
    dashboard/
    case-intake/
    upload-materials/
    review-results/
  api/
    cases/
    events/
    lead-requests/
    profile/
  auth/
components/
  cases/
  dashboard/
  profile/
  site/
  ui/
lib/
  app-events.ts
  case-events.ts
  case-knowledge.ts
  case-files.ts
  case-review.ts
  case-state.ts
  case-workflows.ts
  cases.ts
  dashboard.ts
  lead-requests.ts
  profile.ts
  site.ts
  supabase/
  legacy/
supabase/
  migrations/
```

The active product path is centered on:

- `cases`
- `case_documents`
- `case_review_versions`
- `case_events`
- `lead_requests`
- `app_events`

Primary server-side domain modules:

- `lib/cases.ts`: case reads, review snapshots, workspace facts, resume paths
- `lib/case-review.ts`: deterministic wedge review output generation
- `lib/case-knowledge.ts`: internal structured knowledge adapter for wedge review context
- `lib/case-workflows.ts`: supported use-case definitions and document expectations
- `lib/case-state.ts`: case status machine and history
- `lib/case-events.ts`: structured case-event writes
- `lib/app-events.ts`: public and conversion-path event writes
- `lib/case-files.ts`: storage validation and upload-path helpers
- `lib/dashboard.ts`: case-first dashboard assembly
- `lib/lead-requests.ts`: early-access input validation

## Data Model

Primary wedge tables:

- `cases`
- `case_documents`
- `case_review_versions`
- `case_events`
- `lead_requests`
- `app_events`

Supporting tables:

- `profiles`

Case lifecycle states:

- `draft`
- `intake-complete`
- `materials-updated`
- `reviewed`

Current workflow transitions:

- create case -> `draft`
- complete intake -> `intake-complete`
- update materials -> `materials-updated`
- generate or regenerate review -> `reviewed`

## Storage And Uploads

The app uses a private Supabase Storage bucket named `case-materials`.

Expected storage behavior:

- files are stored under `userId/caseId/documentId/...`
- only the authenticated owner can read, write, replace, or delete objects in that folder
- current upload validation allows:
  - PDF
  - PNG
  - JPEG
  - WEBP
- current per-file limit: 10 MB

Related file metadata is stored in `case_documents`:

- `storage_bucket`
- `storage_path`
- `file_name`
- `file_size_bytes`
- `mime_type`
- `uploaded_at`

## Event Capture

Tideus records structured case events for workflow continuity and later moat analysis.

Current `case_events` types:

- `case_created`
- `intake_started`
- `intake_completed`
- `materials_updated`
- `review_generated`
- `review_regenerated`
- `case_resumed`

Current metadata examples:

- `materials_updated`: changed material counts and current package-state counts
- `review_generated`: readiness, missing-item count, risk count, checklist-ready counts
- `case_resumed`: source surface

Tideus also records narrow public and conversion-path telemetry in `app_events`.

Current `app_events` types:

- `landing_cta_clicked`
- `start_case_selected`
- `book_demo_clicked`
- `early_access_requested`
- `export_clicked`

Current metadata examples:

- CTA source surface
- selected use case
- current readiness status on export
- missing-item and risk counts on export
- lead-request intent and stage on early-access requests

No analytics dashboard ships in this branch. The goal is clean future analysis value without broadening scope.

## AI Workflow Embedding

AI is embedded inside the case workflow only. Tideus does not expose a generic public Copilot surface, broad RAG search, or data portal as the primary product.

Current AI-assisted workflow layers:

- intake normalization: optional freeform intake notes are normalized into typed workflow signals and inferred fields where possible
- material interpretation: material references, file names, statuses, and short notes are lightly classified without OCR or document-content claims
- review enrichment: deterministic review generation remains the baseline, and AI can only refine structured review fields inside a strict schema
- review delta: the latest review can be compared with the previous saved version to produce structured improvements, gaps, risks, and priority actions
- handoff quality: export packets benefit from the structured review fields instead of separate AI prose

## Internal Knowledge Adapter

Tideus can consume external-knowledge capability patterns internally without changing the product surface. The current adapter is deliberately small and scenario-limited.

Supported scenarios:

- Visitor Record
- Study Permit Extension

The adapter borrows only the useful backend pattern from ImmiPilot-style systems: source-aware, versioned, freshness-conscious knowledge context. It does not import ImmiPilot public pages, data dashboards, broad RAG search, pathway comparison, or Copilot UX.

Structured knowledge context is built in `lib/case-knowledge.ts` and passed into case review generation as internal workflow input:

- `processingTimeNote`
- `supportingContextNotes[]`
- `materialsGuidanceNotes[]`
- `scenarioSpecificWarnings[]`
- `officialReferenceLabels[]`
- `references[]`

The review pipeline now combines:

1. deterministic Tideus workflow rules
2. saved case intake and material state
3. optional AI intake normalization
4. optional AI material interpretation
5. internal structured knowledge context
6. optional AI review enrichment inside a strict schema

If AI enrichment is unavailable, the route still uses the knowledge-enhanced deterministic review baseline. If a future live knowledge provider is unavailable, this adapter can return unavailable context without breaking review generation.

Knowledge traceability is stored in existing review metadata:

- `case_review_versions.metadata.knowledgeAdapter`
- `case_review_versions.metadata.aiWorkflow.reviewGeneration.inputSnapshot.knowledgeContext`

Each knowledge context includes:

- source
- source version
- scenario tag
- generated timestamp
- official reference labels
- freshness markers such as `live-check-required`

Processing-time context is intentionally a reminder to check the current official reference, not a stored claim about live processing times.

AI traceability is stored in existing JSON metadata rather than new product surfaces:

- `cases.metadata.aiWorkflow.intakeNormalization`
- `cases.metadata.aiWorkflow.materialInterpretation`
- `case_review_versions.metadata.aiWorkflow.reviewGeneration`
- `case_review_versions.metadata.aiWorkflow.reviewDelta`

Each AI envelope includes:

- source
- prompt version
- model when applicable
- input snapshot
- structured output
- timestamp
- fallback reason when deterministic fallback is used

If OpenAI is unavailable, times out, or returns invalid structure, Tideus falls back to deterministic workflow output.

## Migration Archive Continuity

Older surfaces are still preserved for migration continuity, but they are explicitly secondary to the case workspace.

Migration archive routes:

- `/dashboard/assessments`
- `/dashboard/comparisons`
- `/dashboard/copilot`

Public legacy marketing routes are already demoted and redirected:

- `/assessment`
- `/compare`
- `/copilot`

Migration archive tables:

- `assessments`
- `comparisons`
- `copilot_threads`
- `copilot_messages`

Legacy-only helpers now sit behind `lib/legacy/` for clearer separation. Compatibility bridges remain where needed so older imports and migration-safe behavior do not break suddenly.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- OpenAI dependency installed for future narrow structured assist flows
- Vercel-ready app router structure

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

No new environment variables are required for the current wedge workflow MVP. Uploads, export routing, lead capture, and event capture use the existing Supabase and app configuration.

## Supabase Setup

1. Create a Supabase project.
2. Copy the project URL and publishable key into `.env.local`.
3. Apply these migrations in order:
   - `supabase/migrations/202603300001_sprint_2_foundation.sql`
   - `supabase/migrations/202603300002_sprint_3_workflows.sql`
   - `supabase/migrations/202603310001_sprint_4_profile_expansion.sql`
   - `supabase/migrations/202603310002_sprint_6_case_workspace.sql`
   - `supabase/migrations/202603310003_sprint_6_case_events.sql`
   - `supabase/migrations/202603310004_sprint_7_launch_readiness.sql`
4. Enable Email/Password sign-in in Supabase Auth.
5. If email confirmation is enabled, the app supports `/auth/callback`.

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

Run `npm run typecheck` and `npm run build` serially, not in parallel, because both touch generated build artifacts.

## Trust Boundary

Tideus is not a law firm, government service, or licensed representative. The product is designed to help users organize narrow case-prep workflows, produce structured review-ready outputs, and carry workflow history into a later professional step.

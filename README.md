# Tideus

Tideus is a case-first workflow workspace for high-frequency, document-heavy Canada temporary resident application and extension preparation.

The current wedge is intentionally narrow:

- Visitor Record
- Study Permit Extension

Tideus is not positioned as:

- a broad immigration platform
- a generic immigration chatbot
- a legal advice service
- a tool menu or content portal

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
- supporting context notes
- official reference labels

The current handoff and conversion surfaces include:

- a task-oriented AI front door at `/case-question` that returns structured scenario answers and can create a case workspace
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
- `/case-question`
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
- `/api/case-question`
- `/api/case-question/save`
- `/api/cases/[caseId]/question`
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
    case-question/
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
    case-question/
    cases/
    events/
    lead-requests/
    profile/
  auth/
components/
  cases/
  dashboard/
  legacy/
  profile/
  site/
  ui/
lib/
  app-events.ts
  case-events.ts
  case-knowledge.ts
  case-question.ts
  case-files.ts
  case-review.ts
  case-state.ts
  case-workflows.ts
  cases.ts
  dashboard.ts
  knowledge/
  lead-requests.ts
  profile.ts
  site.ts
  supabase/
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
- `lib/knowledge/`: internal structured knowledge adapter with scenario-specific modules for wedge review and question context
- `lib/case-knowledge.ts`: compatibility facade for migration-safe knowledge adapter imports
- `lib/case-question.ts`: typed parsing and metadata helpers for structured question-to-workspace flows
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

- `materials_updated`: changed count, required-ready count, required-missing count, and current package-state counts
- `review_generated`: readiness status, missing count, risk count, use case, and checklist-ready counts
- `case_resumed`: source surface

Tideus also records narrow public and conversion-path telemetry in `app_events`.

Current `app_events` types:

- `landing_cta_clicked`
- `start_case_selected`
- `use_case_cta_clicked`
- `review_cta_clicked`
- `dashboard_resume_clicked`
- `book_demo_clicked`
- `early_access_requested`
- `export_clicked`

Current metadata examples:

- CTA source surface
- selected use case
- current readiness status and review version on export
- source surface and use-case context on demo and early-access requests
- case status and readiness on dashboard resume clicks
- missing-item and risk counts on export
- lead-request intent and stage on early-access requests

No analytics dashboard ships in this branch. The goal is clean future analysis value without broadening scope.

## AI Workflow Embedding

AI is embedded inside the case workflow only. Tideus does not expose a generic public assistant, broad RAG search, or data portal as the primary product.

Current AI-assisted workflow layers:

- task-oriented AI front door: scenario questions return structured output and can become a saved case workspace
- intake normalization: optional freeform intake notes are normalized into typed workflow signals and inferred fields where possible
- material interpretation: material references, file names, selected checklist types, statuses, and short notes are lightly classified without OCR or document-content claims
- workspace material actions: case-only actions explain missing/review-needed materials, suggest supporting documents, and recommend whether review regeneration is useful
- review enrichment: deterministic review generation remains the baseline, and AI can only refine structured review fields inside a strict schema
- review delta: the latest review can be compared with the previous saved version to produce structured improvements, remaining gaps, new risks, removed risks, and priority actions
- handoff intelligence: export packets include external-review summaries, human-review issues, supporting notes, and escalation triggers

## Internal Knowledge Adapter

Tideus can consume external-knowledge capability patterns internally without changing the product surface. The current adapter is deliberately small and scenario-limited.

Supported scenarios:

- Visitor Record
- Study Permit Extension

The adapter borrows only the useful backend pattern from ImmiPilot-style systems: source-aware, versioned, freshness-conscious knowledge context. It does not import public pages, data dashboards, broad RAG search, pathway tools, or chat UX.

Structured knowledge context is built through `lib/knowledge/adapter.ts` and scenario modules, then passed into question answering and case review generation as internal workflow input:

- `processingTimeNote`
- `supportingContextNotes[]`
- `materialsGuidanceNotes[]`
- `scenarioSpecificWarnings[]`
- `officialReferenceLabels[]`
- `references[]`

The public `/case-question` surface is a task-oriented front door, not a generic chat product. It supports only Visitor Record and Study Permit Extension questions and returns:

- `summary`
- `whyThisMatters`
- `supportingContextNotes[]`
- `scenarioSpecificWarnings[]`
- `nextSteps[]`
- `trackerActions[]`

When a user saves the result, Tideus creates a case-first workspace with seeded expected materials and stores the structured question trace in `cases.metadata.aiWorkflow.caseQuestionAnswers`.

The workspace-level question panel calls `/api/cases/[caseId]/question`, verifies case ownership, grounds the answer in the current case state and latest review, and appends the structured trace to the same case metadata path.

The review pipeline now combines:

1. deterministic Tideus workflow rules
2. saved case intake and material state
3. optional AI intake normalization
4. optional AI material interpretation
5. internal structured knowledge context
6. optional AI review enrichment inside a strict schema
7. optional case-context question answering and material workspace actions inside strict schemas
8. optional review delta and handoff intelligence inside strict schemas

If AI enrichment is unavailable, the route still uses the knowledge-enhanced deterministic review baseline. If a future live knowledge provider is unavailable, this adapter can return unavailable context without breaking review generation.

Knowledge traceability is stored in existing review metadata:

- `case_review_versions.metadata.knowledgeAdapter`
- `case_review_versions.metadata.aiWorkflow.reviewGeneration.inputSnapshot.knowledgeContext`
- `cases.metadata.aiWorkflow.caseQuestionAnswers`

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
- `cases.metadata.aiWorkflow.caseQuestionAnswers`
- `cases.metadata.aiWorkflow.materialWorkspaceActions`
- `case_review_versions.metadata.aiWorkflow.reviewGeneration`
- `case_review_versions.metadata.aiWorkflow.reviewDelta`
- `case_review_versions.metadata.aiWorkflow.handoffIntelligence`

Material interpretation output is stored after material updates and stays workflow-oriented:

- `likelyDocumentType`
- `confidence`
- `possibleIssues[]`
- `likelySupportingDocsNeeded[]`
- `recommendedMaterialStatus`
- `suggestedNextAction`
- `reasoningSummary`

Workspace material actions are available only inside the case workspace and are tied to a selected case document:

- `explain-missing`
- `explain-review-needed`
- `suggest-next-action`
- `suggest-regenerate-review`
- `suggest-supporting-docs`

These actions return the same structured material fields plus `regenerateReviewRecommendation` and `readinessImpact`.

Review delta output is stored with the latest review version when a previous version exists:

- `improvedAreas[]`
- `remainingGaps[]`
- `newRisks[]`
- `removedRisks[]`
- `priorityActions[]`

Handoff intelligence is stored with each generated review version:

- `externalSummary`
- `reviewReadyStatus`
- `issuesNeedingHumanReview[]`
- `supportingNotes[]`
- `escalationTriggers[]`

Both layers preserve review-version input snapshots through their AI envelopes and fall back to deterministic output if AI is unavailable.

Each AI envelope includes:

- source
- prompt version
- model when applicable
- input snapshot
- structured output
- timestamp
- fallback reason when deterministic fallback is used

If OpenAI is unavailable, times out, or returns invalid structure, Tideus falls back to deterministic workflow output.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- OpenAI SDK for server-side structured workflow assist flows
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
   - `supabase/migrations/202604090001_expand_app_event_types.sql`
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

## Migration Archive

Older assessment, comparison, and Copilot records are preserved only for migration continuity. They are not primary product surfaces and should not shape new workflow work.

Archive routes:

- `/dashboard/assessments`
- `/dashboard/comparisons`
- `/dashboard/copilot`

Redirected legacy public routes:

- `/assessment`
- `/compare`
- `/copilot`

Archive tables:

- `assessments`
- `comparisons`
- `copilot_threads`
- `copilot_messages`

Legacy-only helpers sit behind `lib/legacy/`, and legacy-only UI sits behind `components/legacy/`. This includes migration-era decision-support logic, assistant helpers, archive navigation, and archive dashboard affordances.

# Tideus

Tideus is a case-first workflow workspace for high-frequency, document-heavy Canada temporary resident preparation.

Phase 1 wedge scenarios:

- Visitor Record
- Study Permit Extension

Tideus is not:

- a broad immigration platform
- a generic immigration chatbot
- a legal advice service
- a public data or news portal
- a tool menu with disconnected AI surfaces

## Product Shape

This branch is an early-access wedge workflow MVP centered on a saved case record.

Primary workflow:

1. Select a supported scenario
2. Create or resume a case
3. Complete intake
4. Update expected materials
5. Generate a structured review
6. Save, resume, ask a case-scoped question, or export the latest packet

Structured output stays narrow and repeatable:

- readiness status
- checklist
- missing items
- risk flags
- timeline note
- next steps
- supporting context notes
- official reference labels

Primary product surfaces:

- public case entry at `/start-case`
- task-oriented AI entry at `/case-question`
- a saved case workspace
- a private materials workflow
- a structured review page
- a print / export handoff packet
- Book Demo / Early Access at `/book-demo`

## Full Chinese Architecture

The full product surface supports:

- Simplified Chinese: `zh-CN`
- Traditional Chinese: `zh-TW`

Chinese support is not limited to critical paths. It covers:

- marketing pages
- auth flows
- case intake
- workspace pages
- materials management
- review outputs
- review delta output
- export / handoff packets
- Book Demo / Early Access
- trust, privacy, terms, footer, shared CTA text
- loading, empty, success, and error states
- migration archive continuity surfaces

Localization architecture:

- `lib/i18n/config.ts`: supported locales and cookie key
- `lib/i18n/messages.ts`: shared UI copy
- `lib/i18n/server.ts`: server-side locale resolution
- `lib/i18n/client.tsx`: client locale context
- `lib/i18n/workspace.ts`: workspace-focused labels and formatting helpers
- `lib/i18n/format.ts`: locale-aware formatting helpers
- `app/api/preferences/locale/route.ts`: locale preference persistence
- `components/site/language-switcher.tsx`: user-facing locale switcher

Language preference is explicit and persisted by cookie. Workspace pages, export packets, and AI-assisted outputs all read the chosen language directly.

## Surface Map

Public:

- `/`
- `/how-it-works`
- `/use-cases`
- `/use-cases/[slug]`
- `/case-question`
- `/start-case`
- `/for-professionals`
- `/professional/login`
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
- `/professional/dashboard`
- `/professional/handoffs`
- `/professional/handoffs/[handoffId]`

Primary APIs:

- `/api/cases`
- `/api/cases/[caseId]/documents`
- `/api/cases/[caseId]/documents/[documentId]/upload`
- `/api/cases/[caseId]/review`
- `/api/cases/[caseId]/handoff`
- `/api/case-question`
- `/api/case-question/save`
- `/api/cases/[caseId]/question`
- `/api/cases/[caseId]/materials/action`
- `/api/events`
- `/api/lead-requests`
- `/api/profile`
- `/api/preferences/locale`
- `/api/professional/handoffs/[handoffId]`
- `/api/billing/checkout`
- `/api/billing/webhook`

Internal-only APIs:

- `/api/internal/knowledge/refresh`

## Case-First Architecture

The active product path is centered on:

- `cases`
- `case_documents`
- `case_review_versions`
- `case_events`
- `lead_requests`
- `app_events`

Primary server-side domain modules:

- `lib/cases.ts`: case reads, review snapshots, workspace facts, resume paths
- `lib/case-review.ts`: deterministic wedge review generation
- `lib/case-ai.ts`: strict-schema AI enrichment, material interpretation, review delta, handoff intelligence, and workspace AI actions
- `lib/case-question.ts`: typed question parsing and question-to-workspace helpers
- `lib/case-workflows.ts`: supported use-case definitions and expected materials
- `lib/case-state.ts`: case status machine and package-state history
- `lib/case-events.ts`: structured case-event writes
- `lib/app-events.ts`: public and conversion-path event writes
- `lib/case-files.ts`: storage validation and upload-path helpers
- `lib/dashboard.ts`: case-first dashboard assembly
- `lib/lead-requests.ts`: early-access validation
- `lib/profile.ts`: saved profile helpers for current case workflows
- `lib/knowledge/`: internal structured knowledge adapter and refresh support

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
- `professional_profiles`
- `organizations`
- `organization_members`
- `handoff_requests`
- `case_assignments`

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
- current upload validation allows PDF, PNG, JPEG, and WEBP
- current per-file limit: 10 MB

Related file metadata is stored in `case_documents`:

- `storage_bucket`
- `storage_path`
- `file_name`
- `file_size_bytes`
- `mime_type`
- `uploaded_at`

## Event Capture

Tideus records structured events for workflow continuity and future moat analysis.

Current `case_events` types:

- `case_created`
- `intake_started`
- `intake_completed`
- `materials_updated`
- `review_generated`
- `review_regenerated`
- `case_resumed`

Current `app_events` types:

- `landing_cta_clicked`
- `start_case_selected`
- `use_case_cta_clicked`
- `review_cta_clicked`
- `dashboard_resume_clicked`
- `book_demo_clicked`
- `early_access_requested`
- `export_clicked`
- `knowledge_refresh_completed`

Current metadata examples:

- `materials_updated`: changed count, required-ready count, required-missing count, and package-state counts
- `review_generated`: readiness status, missing count, risk count, use case, and checklist-ready counts
- `export_clicked`: use case, readiness status, review version, missing count, and risk count
- `dashboard_resume_clicked`: case status and readiness
- `book_demo_clicked` / `early_access_requested`: source surface and use-case context
- `knowledge_refresh_completed`: scenario tag, source label, source version, and refresh timestamp

No analytics dashboard ships in this branch. The goal is clean future analysis value without widening scope.

## AI Workflow Embedding

AI is embedded inside the workflow only. Tideus does not expose a generic public assistant, broad RAG search, or portal-like knowledge surface.

Current AI-assisted workflow layers:

- task-oriented AI front door: scenario questions return structured output and can create a case workspace
- intake normalization: optional freeform intake notes are normalized into typed workflow signals
- material interpretation: material references, file names, selected types, and short notes are lightly classified without OCR or document-content claims
- workspace material actions: case-only actions explain missing or review-needed materials, suggest supporting documents, and recommend whether to regenerate review
- review enrichment: deterministic review generation remains the baseline and AI can only refine structured fields inside a strict schema
- review delta: the latest review can be compared with the previous saved version
- handoff intelligence: export packets include external-review summaries, human-review issues, supporting notes, and escalation triggers

All user-facing AI output supports `zh-CN` and `zh-TW`. The output language is passed explicitly through the request and trace metadata rather than inferred from user input.

## Internal Knowledge Adapter

Tideus can consume external-knowledge capability patterns internally without changing the product surface. The adapter is deliberately small and scenario-limited.

Supported scenarios:

- Visitor Record
- Study Permit Extension

Structured knowledge context is built through `lib/knowledge/adapter.ts` and scenario modules, then passed into question answering and case review generation as internal workflow input:

- `processingTimeNote`
- `supportingContextNotes[]`
- `materialsGuidanceNotes[]`
- `scenarioSpecificWarnings[]`
- `officialReferenceLabels[]`
- `references[]`

The adapter borrows only the useful backend pattern from ImmiPilot-style systems: source-aware, versioned, freshness-conscious workflow context. It does not import public pages, data dashboards, broad RAG search, pathway tools, or chat UX.

## Immi Fusion Boundary

Immi-to-Tideus fusion is backend-only. Tideus keeps its workflow-first frontend shell, and ImmiPilot-style capabilities may contribute only internal knowledge, public-information references, rule patterns, retrieval support, and refresh mechanics that feed saved workflow outputs.

Formal mapping:

- `docs/fusion/immi-to-tideus-fusion-map.md`

Current and future landing zones:

- `lib/knowledge/`: scenario packs, knowledge adapter, processing-time notes, official reference labels, and refresh snapshots
- `lib/public-info/`: internal source descriptors, processing-time reference contracts, source freshness metadata, and future retrieval source contracts
- `lib/review-rules/`: deterministic condition helpers for checklist, missing item, risk flag, priority action, review handoff, and escalation output
- `docs/fusion/`: governance for what may be absorbed, delayed, or excluded

Excluded from active Tideus frontend fusion:

- public news portal
- public data portal
- public compare tools
- public processing-time lookup
- public guide portals beyond the current wedge
- generic public copilot or broad RAG chat

## Knowledge Refresh Pipeline

Knowledge remains an internal enhancement layer. Tideus does not expose refreshed knowledge as a public portal or searchable content surface.

The refresh path is deliberately narrow:

- supported scenarios only: Visitor Record and Study Permit Extension
- structured localized payloads only: `zh-CN` and `zh-TW`
- stored through `app_events` as versioned internal refresh snapshots
- consumed by the adapter with deterministic fallback to static scenario modules

Refresh pipeline modules:

- `lib/knowledge/types.ts`
- `lib/knowledge/adapter.ts`
- `lib/knowledge/refresh.ts`
- `lib/knowledge/scenarios/visitor-record.ts`
- `lib/knowledge/scenarios/study-permit-extension.ts`
- `/api/internal/knowledge/refresh`

Each refresh snapshot can carry localized structured fields such as:

- `processingTimeNote`
- `supportingContextNotes[]`
- `scenarioSpecificWarnings[]`
- `officialReferenceLabels[]`

Traceability is preserved through:

- scenario tag
- source label
- source version
- refresh timestamp
- adapter version
- source kind: static adapter or refreshed snapshot

## AI Traceability

AI traceability is stored in existing JSON metadata rather than new product surfaces:

- `cases.metadata.aiWorkflow.intakeNormalization`
- `cases.metadata.aiWorkflow.materialInterpretation`
- `cases.metadata.aiWorkflow.caseQuestionAnswers`
- `cases.metadata.aiWorkflow.materialWorkspaceActions`
- `case_review_versions.metadata.aiWorkflow.reviewGeneration`
- `case_review_versions.metadata.aiWorkflow.reviewDelta`
- `case_review_versions.metadata.aiWorkflow.handoffIntelligence`
- `case_review_versions.metadata.knowledgeAdapter`

Each AI envelope includes:

- source
- prompt version
- model when applicable
- input snapshot
- structured output
- timestamp
- fallback reason when deterministic fallback is used

If OpenAI is unavailable, times out, or returns invalid structure, Tideus falls back to deterministic workflow output.

## Plan And Permission Enforcement

Tideus treats access level as a system-level fact, not a frontend display choice.

Current durable access model:

- Anonymous users can access public product pages and limited public-information entry, but cannot create saved workflow state.
- Free C-side users have saved workflow access with a limited active-case allowance and basic workflow outputs.
- Pro C-side users unlock materially stronger workflow value, including more active cases, case-scoped workspace AI actions, review delta output, handoff intelligence, and professional handoff requests.
- Professional B-side users require an active `professional_profiles` record or active `organization_members` record before professional dashboard and handoff inbox access is granted.
- Internal admin access is metadata-backed and only used where current server paths need controlled override behavior.

Server-side enforcement points:

- `profiles.consumer_plan_tier`, `profiles.consumer_plan_status`, `profiles.consumer_plan_source`, and `profiles.consumer_plan_activated_at` persist C-side plan state.
- `lib/permissions.ts` centralizes role and permission reads using Supabase Auth plus profile, professional profile, and organization membership records.
- `/api/cases` and `/api/case-question/save` enforce active-case limits before writing new saved cases.
- `/api/cases/[caseId]/question`, `/api/cases/[caseId]/materials/action`, `/api/cases/[caseId]/review`, and `/api/cases/[caseId]/handoff` enforce Pro workflow capabilities server-side.
- `/professional/dashboard` and the professional handoff inbox only load for active professional profiles, active organization members, or internal admin users.

Stripe checkout and webhook sync now update the same durable profile plan fields. Current Pro entitlement is granted only when the subscription lifecycle state is active or trialing; inactive, canceled, expired, or paused subscription states do not unlock Pro-only server capabilities.

## Billing Lifecycle

Free / Pro is now a commercial lifecycle, not only product copy.

Current billing flow:

- Authenticated C-side users start Pro checkout through `/api/billing/checkout`.
- Stripe redirects back to `/billing/success` or `/billing/cancel`.
- `/api/billing/webhook` verifies the Stripe signature, records billing events idempotently, and syncs subscription state into `billing_subscriptions`, `billing_events`, and `profiles.consumer_plan_*`.
- Profile plan state remains the runtime permission source for active-case limits, workspace AI actions, review delta, handoff intelligence, and professional handoff requests.

Required Stripe deployment configuration:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- A Stripe webhook endpoint pointing to `/api/billing/webhook`
- Webhook events covering checkout completion and subscription lifecycle changes, especially `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`

## Professional Handoff Operations

The B-side is now an operational backend foundation for professional handoff intake, not just a placeholder shell.

Current professional capabilities:

- View an operational dashboard with active handoff counts, new request counts, in-review counts, and high-risk request counts.
- Open a professional handoff queue at `/professional/handoffs`.
- Inspect a handoff detail page at `/professional/handoffs/[handoffId]`.
- Review the latest handoff packet summary, client identity snapshot, case type, readiness state, key case facts, risk counts, missing material summary, next steps, and human-review prompts.
- Move a handoff through a minimal status lifecycle: new, opened, in review, closed.
- Preserve handling structure by setting `professional_user_id` when a professional opens or begins reviewing an unassigned handoff.
- Save a small internal notes field for future professional review continuity.

This is intentionally not a full CRM. There is no broad assignment engine, client management module, team collaboration workspace, or full professional review workflow in this sprint.

Professional access remains server-enforced:

- Professional pages require an active professional profile, active organization membership, or internal admin access.
- Professional handoff queries explicitly filter by assigned professional, organization membership, or unassigned intake visibility.
- The professional status update API rejects unauthorized C-side users and unauthorized professional users.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style component structure
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- OpenAI SDK for server-side structured workflow assist flows
- Vercel-ready App Router structure

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for Pro checkout and subscription sync:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Optional but recommended:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `TIDEUS_KNOWLEDGE_REFRESH_TOKEN`
- `SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

`OPENAI_API_KEY` is optional for local deterministic fallback, but should be configured in production for AI-enhanced workflow output.

`TIDEUS_KNOWLEDGE_REFRESH_TOKEN` is required only when `/api/internal/knowledge/refresh` will be used.

## Vercel Deployment

Use Node.js 22 or newer and deploy the App Router project with the same environment variables listed above.

Deployment notes:

- Do not commit or depend on `node_modules`, `.next`, `.tmp`, `.DS_Store`, `__MACOSX`, or `tsconfig.tsbuildinfo`.
- Run `npm install`, `npm run typecheck`, and `npm run build` before promotion.
- Configure the Stripe webhook URL after the Vercel production URL is available.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, and `TIDEUS_KNOWLEDGE_REFRESH_TOKEN` server-only.
- Set `NEXT_PUBLIC_APP_URL` to the canonical deployed origin so auth callbacks and Stripe return URLs are stable.

## Supabase Setup

1. Create a Supabase project.
2. Copy the project URL, publishable key, and service role key into `.env.local`.
3. Apply these migrations in order:
   - `supabase/migrations/202603300001_sprint_2_foundation.sql`
   - `supabase/migrations/202603300002_sprint_3_workflows.sql`
   - `supabase/migrations/202603310001_sprint_4_profile_expansion.sql`
   - `supabase/migrations/202603310002_sprint_6_case_workspace.sql`
   - `supabase/migrations/202603310003_sprint_6_case_events.sql`
   - `supabase/migrations/202603310004_sprint_7_launch_readiness.sql`
   - `supabase/migrations/202604090001_expand_app_event_types.sql`
   - `supabase/migrations/202604100001_add_knowledge_refresh_event_type.sql`
   - `supabase/migrations/202604100002_add_professional_shell.sql`
   - `supabase/migrations/202604110001_add_handoff_requests.sql`
   - `supabase/migrations/202604210001_add_plan_permission_model.sql`
   - `supabase/migrations/202604220001_add_professional_handoff_operations.sql`
   - `supabase/migrations/202604220002_add_billing_subscription_lifecycle.sql`
4. Enable Email/Password sign-in in Supabase Auth.
5. If email confirmation is enabled, the app supports `/auth/callback`.
6. Create the private Supabase Storage bucket `case-materials`.

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

Legacy-only helpers sit behind `lib/legacy/`, and legacy-only UI sits behind `components/legacy/`.

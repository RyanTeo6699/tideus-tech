# AGENTS.md

## Project Identity

Tideus is an AI-driven, workflow-first application preparation platform.

It is a two-sided platform:
- C-side: immigration clients / applicants
- B-side: immigration agencies, consultants, or law firms

Tideus is NOT:
- a generic immigration chatbot
- a broad immigration portal
- a public news or data platform
- a pure case-management utility
- a legal advice product
- a replacement for licensed professionals

## Core Product Definition

The core product loop is:

1. the user asks a scenario question or starts a workflow task
2. AI answers using public information plus user/case context
3. AI reduces repetitive preparation work
4. meaningful outputs enter a saved workflow record
5. the user continues progressing the case over time
6. the workflow produces review-ready and handoff-ready outputs

The strongest product characteristic is:
**a clear workflow that turns answers into progress.**

Results do not merely "land in tracker".
Results must enter workflow.
Tracker and workspace are operational layers inside the workflow, not the product definition by themselves.

## Product Shape

The active product must remain:
- workflow-first
- task-oriented
- case-aware
- structured-output-first
- AI-enhanced
- tracker/workspace-backed
- handoff-ready

The active product must NOT drift into:
- generic chat-first UX
- broad portal UX
- feature-sprawl dashboards
- "we do everything" positioning
- disconnected tool menus

## Two-Sided Platform Rule

The product must support both sides of the platform.

### C-side

The C-side experience should let users:
- ask scenario-specific questions
- get structured answers informed by public information
- reduce repetitive preparation work through AI
- create and update workflow records
- manage materials
- review progress over time
- export or hand off outputs when ready

### B-side

The B-side must be prepared architecturally early, even if the surface is phased.

Architecture must reserve room for:
- professional profiles
- organizations
- organization members
- handoff queues
- case assignment
- external review workflows

B-side work must not hijack the primary C-side product shell.

## Plan And Access Separation Rule

There must be clear, visible, structural differences between:
- anonymous users
- free registered C-side users
- paid Pro C-side users
- Professional B-side users

These tiers must differ in substance, not just volume.

### Anonymous

Anonymous access may cover:
- public product pages
- supported scenario discovery
- limited public-information-backed AI entry

Anonymous access must NOT become a full saved workflow experience.

### Free C-side

Free registered users may have:
- saved cases
- basic workspace continuity
- core materials tracking
- structured review generation within the narrow supported workflows

### Pro C-side

Paid Pro users should have clearly stronger workflow value, such as:
- deeper repetitive-work reduction
- stronger automation
- richer delta / handoff intelligence
- more advanced review continuity

### Professional B-side

Professional access is a separate product role, not just an upgraded consumer plan.

Professional capabilities should be architecturally distinct and may include:
- review queues
- assignment
- client handoff intake
- organization visibility
- professional review actions

Free, Pro, and Professional must stay conceptually distinct in architecture, copy, and future gating decisions.

## Frontend Product Surfaces

Primary active product surfaces should center around:
- Home / AI Task Entry
- Scenario Entry Pages
- AI Answer Surface
- Tracker / Workspace
- Materials Workflow
- Review / Delta / Handoff Surfaces
- Book Demo / Request Review
- Professional shell pages when explicitly added

Public messaging should emphasize:
- AI helps answer your scenario questions
- AI helps reduce repetitive preparation work
- outputs enter a workflow-backed workspace
- the user can continue progressing the task/case over time
- the product supports clean future human handoff

Do not position the product around:
- standalone assessments
- standalone comparisons
- standalone copilot tools

## AI Placement Rule

AI must be embedded into workflow, not exposed as a floating generic assistant.

Primary AI layers:
1. question understanding
2. public-information answering
3. repetitive work automation
4. material interpretation
5. structured review generation
6. review delta generation
7. handoff intelligence

AI outputs must remain structured and actionable.

Avoid long generic freeform prose whenever a structured result is more appropriate.

## Public Information And Immi Fusion Rule

Tideus must NOT merge the Immi frontend directly.

Correct fusion means:
- Tideus keeps the frontend product shell
- Immi contributes backend-only capabilities
- AI remains embedded in Tideus workflow/task execution
- public portal-style Immi surfaces do not become primary Tideus surfaces

Allowed backend-only fusion includes:
- public-information knowledge
- retrieval / reranking support
- rule libraries
- processing-time references
- scenario-specific guidance
- knowledge refresh pipelines

Do NOT prioritize:
- public news portal
- public guides portal
- public compare-pathway tools
- public data portal pages
- generic public copilot/chat pages

## Language Requirements (Hard Requirement)

The full active product surface must support:
- Simplified Chinese (`zh-CN`)
- Traditional Chinese (`zh-TW`)

This is mandatory.

Rules:
1. Do not leave English hardcoded in active product surfaces.
2. All key product pages and states must support both Chinese variants.
3. AI outputs must support both `zh-CN` and `zh-TW`.
4. Language preference must be explicit and persisted where appropriate.
5. Underlying schemas and business logic must remain stable and must not be duplicated by language.
6. UI copy, CTA text, loading states, empty states, errors, export packets, and AI-generated user-facing text must all respect the chosen Chinese language.

English, if retained at all, is secondary and must not drive architecture decisions.

## Core Entities

Primary workflow entities:
- profiles
- cases
- case_intakes
- case_documents
- case_review_versions
- case_review_deltas
- case_events
- app_events
- lead_requests

B-side preparation entities:
- professional_profiles
- organizations
- organization_members
- handoff_requests
- case_assignments

Entity roles:
- `profiles` hold long-term reusable context
- `cases` are the main execution record
- `case_documents` track material state
- `case_review_versions` track structured review history
- `case_review_deltas` track review-to-review change
- `case_events` track workflow progression
- `app_events` track funnel/product interaction
- `lead_requests` capture conversion intent

Legacy assessment/comparison/copilot entities may remain only for migration continuity and must never define new architecture.

## Workflow Rule

All major outputs must enter workflow.

Workflow includes:
- user entry
- structured input
- AI enhancement
- case/task progression
- material state updates
- review generation
- review delta generation
- handoff/export

Tracker and workspace are workflow layers, not the product core by themselves.

## Current Supported Public Scenarios

Only the current wedge scenarios should be actively developed:
- Visitor Record
- Study Permit Extension

Do not add new public scenarios unless explicitly directed.

## Required Output Shape

Preferred outputs include:
- summary
- whyThisMatters
- readinessStatus
- checklist
- missingItems
- riskFlags
- nextSteps
- timelineNote
- supportingContextNotes
- officialReferenceLabels
- improvedAreas
- remainingGaps
- newRisks
- removedRisks
- priorityActions
- externalSummary
- reviewReadyStatus
- issuesNeedingHumanReview
- escalationTriggers

The product should not rely on long unstructured answer walls.

## Event Intelligence Rule

Important workflow and funnel events should be captured cleanly.

### Case event examples
- case_created
- intake_started
- intake_completed
- materials_updated
- review_generated
- review_regenerated
- case_resumed
- export_clicked

### App event examples
- landing_cta_clicked
- use_case_cta_clicked
- start_case_selected
- review_cta_clicked
- dashboard_resume_clicked
- book_demo_clicked
- early_access_requested

Useful metadata should be included where practical:
- useCase
- readinessStatus
- missingCount
- riskCount
- reviewVersion
- sourceSurface
- changedCount

Do not add noisy analytics for vanity purposes.

## Legacy / Migration Rule

Legacy assessment/comparison/copilot surfaces may remain only for migration continuity.

They must not:
- define active product architecture
- shape primary navigation
- shape primary dashboard metrics
- shape homepage messaging
- shape plan separation
- shape future AI strategy

Legacy code should be isolated clearly under legacy/archive paths where practical.

Examples:
- `lib/legacy/*`
- `components/legacy/*`

If a function or module exists only for continuity, make that explicit in naming and placement.

## Engineering Rules

1. Keep active product paths aligned with the current platform definition.
2. Keep AI server-side.
3. Keep ownership filtering explicit.
4. Keep deterministic fallback available whenever AI or knowledge enhancement exists.
5. Keep code typed and maintainable.
6. Do not widen scope casually.
7. If a function signature changes, all call sites must be updated in the same round.
8. If localization keys change, both `zh-CN` and `zh-TW` must be completed in the same round.
9. Preserve stable auth, storage, upload flow, export packet, and current workflow continuity unless explicitly changing them.
10. A sprint is not done unless `npm run typecheck` passes.

## Current Priorities

1. keep the active product workflow-first
2. strengthen public-information-backed answering
3. strengthen AI-driven repetitive-work reduction
4. strengthen tracker/workspace progression
5. strengthen review delta and handoff quality
6. support full-site `zh-CN` and `zh-TW`
7. establish clear Free / Pro / Professional separation
8. prepare the B-side backend shell without widening public scope
9. strengthen backend-only knowledge refresh and Immi capability fusion

## What Not To Build Now

Do not build now:
- broad public news/content portal
- public data portal
- broad compare-pathway product
- generic public copilot
- large admin platform
- overbuilt CRM
- broad scenario expansion
- payment-first expansion before plan/value separation is clear
- any feature that weakens workflow clarity

## North Star

The product should feel like:

**an AI-driven workflow platform that uses public information plus user/case context to answer questions, reduce repetitive preparation work, and continuously move a saved case toward review-ready and handoff-ready outputs, while reserving clear room for future professional-side review workflows.**

# AGENTS.md

## Project Identity

Tideus is a two-sided, AI-driven, workflow-first application preparation platform.

It serves:
- C-side: immigration clients / applicants
- B-side: immigration agencies, consultants, and law firms

Tideus is NOT:
- a generic chatbot
- a broad immigration portal
- a public news/data site
- a pure tracker app
- a pure case-management utility
- a legal advice product
- a replacement for licensed professionals

---

## Core Product Definition

The core of Tideus is not tracker by itself.

The strongest product characteristic is:

**a very clear workflow that turns answers into progress.**

AI uses public information plus user/case context to answer questions and reduce repetitive preparation work.
Those outputs must enter workflow, not merely sit in chat or tracker.

Correct model:
- AI helps answer
- AI helps automate repetitive work
- outputs enter workflow
- workflow progresses over time
- tracker and workspace are operational/visual layers inside workflow

Incorrect model:
- AI chat as the product
- tracker as the product core
- isolated tools without progression
- portal-style browsing as the main experience

---

## Product Shape

The active product must remain:
- workflow-first
- task-oriented
- case-aware
- structured-output-first
- AI-enhanced
- tracker/workspace-backed
- handoff-ready
- platform-oriented

The active product must NOT drift into:
- generic chat-first UX
- portal UX
- disconnected tool menus
- feature-sprawl dashboards
- “we do everything” positioning

---

## Workflow Rule (Highest Product Rule)

All major outputs must enter workflow.

Workflow includes:
1. user entry
2. structured input
3. AI/public-information enhancement
4. case/task progression
5. material state updates
6. review generation
7. review delta generation
8. export / handoff
9. B-side review continuation

Tracker is only part of workflow.
Workspace is only the container layer of workflow.
Neither replaces workflow as the product core.

Every new feature must strengthen workflow clarity and progression.

---

## Two-Sided Platform Rule

The platform must support both sides.

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
The B-side is not decorative.
It must be architecturally real.

The system must reserve and increasingly support:
- professional profiles
- organizations
- organization members
- handoff queues
- handoff detail review
- case assignment foundations
- internal review notes foundations
- future collaboration workflows

B-side work must not hijack the C-side shell, but it is a real product line, not a placeholder forever.

---

## Free / Pro / Professional Rule

There must be clear, visible, structural differences between:
- anonymous users
- free registered C-side users
- paid Pro C-side users
- Professional B-side users

These tiers must differ in substance, not just usage volume.

### Anonymous
May access:
- public product pages
- supported scenario discovery
- limited public-information-backed AI entry

Must NOT get:
- full saved workflow continuity
- advanced workflow value
- protected operational surfaces

### Free C-side
May access:
- basic saved workflow continuity
- core materials tracking
- structured review generation in the narrow supported workflows

Must remain materially limited compared with Pro.

### Pro C-side
Should unlock materially stronger workflow value, including where applicable:
- deeper repetitive-work reduction
- richer delta / handoff intelligence
- stronger workflow continuity
- stronger materials/review support
- stronger saved workflow value

### Professional B-side
Professional is not merely an upgraded consumer plan.
It is a separate role with operational responsibilities and dedicated backend access.

### Enforcement rule
Free / Pro / Professional must be system facts, not just UI copy.
Permissions and capabilities must be enforced server-side, not merely hidden in the UI.

---

## Billing / Subscription Lifecycle Rule

Billing is now a real product layer.

Subscription state must be treated as a system fact.

The system must correctly model and handle lifecycle states such as:
- active
- inactive
- canceled
- expired
- trialing (only if used)
- other billing states only when truly needed

Capabilities must derive from plan/role state.
Plan state must not be simulated only in frontend presentation.

Webhook and subscription sync logic are part of the core platform infrastructure.

---

## Frontend Product Surfaces

Primary active surfaces should center around:
- Home / AI Task Entry
- Scenario Entry Pages
- AI Answer Surface
- Tracker / Workspace
- Materials Workflow
- Review / Delta / Handoff Surfaces
- Pricing / Upgrade
- Book Demo / Request Review
- For Professionals
- Professional operational backend surfaces

Public messaging should emphasize:
- AI helps answer scenario questions
- AI helps reduce repetitive preparation work
- outputs enter workflow
- users can continue progressing tasks/cases
- the system supports clean human handoff

Do not position the product around:
- standalone assessments
- standalone comparisons
- standalone copilot tools
- public compare products
- public portal navigation

---

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

Prefer:
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

Avoid long generic freeform answer walls whenever a structured output is more appropriate.

---

## Public Information / Immi Fusion Rule

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

---

## Knowledge Refresh Rule

Knowledge refresh is now a production capability, not an experiment.

Refreshed knowledge must:
- remain internal-first
- support current active scenarios only unless explicitly expanded
- be versioned or traceable
- carry source labels where practical
- fail gracefully without breaking workflow
- actually affect answer/review/export outputs

Refresh infrastructure must not remain an isolated backend utility that never reaches user-facing workflow value.

---

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

English, if retained, is secondary and must not drive architecture decisions.

---

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

B-side operational entities:
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
- `handoff_requests` connect C-side workflow to B-side operational review
- `case_assignments` support future B-side execution ownership

Legacy assessment/comparison/copilot entities may remain only for migration continuity and must never define new architecture.

---

## Current Product Stage

The project is no longer in early MVP definition mode.

The current stage is:

**commercialization + platformization + productionization**

This means current priorities are no longer:
- broad new feature invention
- portal expansion
- new public tool surfaces

Current priorities ARE:
1. workflow integrity
2. subscription and permission integrity
3. bilingual completeness
4. B-side operational reliability
5. knowledge refresh reliability
6. deployment/build reliability
7. production hardening
8. docs/env/monitoring alignment

---

## Current Priorities

Priority order:
1. keep workflow strong and coherent
2. enforce subscription/plan/role capabilities server-side
3. strengthen B-side operational backend
4. productionize knowledge refresh
5. stabilize deployment/build/runtime behavior
6. complete bilingual alignment
7. improve handoff quality
8. keep documentation aligned with actual architecture

---

## What Not To Build Now

Do not build now:
- public news/content portal
- broad public data portal
- public compare-pathway products
- generic public copilot
- broad scenario expansion
- overbuilt CRM
- large admin platform
- broad role complexity beyond current platform needs
- any feature that weakens workflow clarity
- any feature that widens public surface faster than the workflow/platform core can support

---

## Engineering Rules

1. Preserve stable auth, storage, workflow, billing lifecycle, and current platform structure.
2. Keep ownership and access filtering explicit.
3. Keep AI server-side.
4. Keep deterministic fallback whenever AI/knowledge enhancement exists.
5. Keep code typed, maintainable, and production-minded.
6. Do not widen scope casually.
7. If a function signature changes, all call sites must be updated in the same round.
8. If localization keys change, both `zh-CN` and `zh-TW` must be completed in the same round.
9. A sprint is not complete unless both `npm run typecheck` and `npm run build` pass in a clean install environment.
10. Do not combine major architectural changes and major feature expansion in the same sprint unless explicitly required.

---

## Build / Repo Discipline (Hard Requirement)

The repo and delivery package must remain clean.

Do NOT commit or ship:
- `node_modules/`
- `.next/`
- `.tmp/`
- `__MACOSX/`
- `.DS_Store`

A clean environment verification is mandatory for completion.

Every serious sprint should be verifiable with:
- `rm -rf node_modules .next .tmp`
- `npm install`
- `npm run typecheck`
- `npm run build`

If that sequence does not pass, the sprint is not done.

---

## Delivery Discipline

Every Codex sprint should be single-purpose.

Prompts should:
- define one primary objective
- define hard boundaries
- forbid unrelated scope expansion
- require exact verification steps

Do not run multi-theme “mega sprints” that combine:
- product redesign
- billing changes
- platform role changes
- i18n rewrites
- knowledge system rewrites
in one round unless absolutely required.

---

## Documentation Rule

README and internal docs must match the current actual platform state.

They must not lag behind the architecture.
They must not continue to describe the product as an earlier single-sided case-only MVP once the platform has evolved beyond that stage.

---

## Final North Star

Tideus is a workflow-first, AI-driven, public-information-enhanced two-sided platform.

Its core promise is:

**not just answering questions, but turning answers into progress through a clear workflow that can continue, upgrade, and hand off across C-side and B-side surfaces.**
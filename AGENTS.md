# AGENTS.md

## Project Identity

Tideus is an AI-driven task-oriented application preparation platform.

It is NOT:
- a generic immigration chatbot
- a broad immigration portal
- a public data/news platform
- a pure case-management utility
- a legal advice product
- a replacement for licensed professionals

Tideus helps users:
1. ask questions about their scenario
2. get answers informed by public information
3. reduce repetitive preparation work through AI
4. save outputs into a tracker/workspace
5. continue progressing a case over time
6. export review-ready/handoff-friendly summaries

---

## Core Product Definition

The core of this project is:

**AI answers user questions using public information and user/case context, AI automates repetitive preparation work, and all meaningful outputs are saved into a tracker/workspace that can be continuously progressed.**

This means the product combines:
- AI answer layer
- repetitive-work automation
- tracker/workspace execution layer
- structured review and handoff outputs

---

## Product Shape

The product must remain:

- task-first
- tracker/workspace-backed
- workflow-driven
- structured-output-first
- case-aware
- human-handoff-ready

The product must NOT drift into:
- generic chat-first UX
- broad portal UX
- feature-sprawl dashboards
- “we do everything” messaging

---

## Fusion Principle: Immi × Tideus

Tideus must NOT merge the Immi frontend directly.

Correct fusion means:
- Tideus keeps the frontend product shell
- Immi contributes backend knowledge/data/retrieval/rule/update capabilities
- AI remains embedded in Tideus workflow/task execution
- public portal-style Immi surfaces should not become primary Tideus surfaces

### What may be absorbed from Immi
- public information knowledge
- retrieval / reranking support
- rule / condition libraries
- processing time references
- scenario-specific guidance
- knowledge refresh/update pipeline

### What must NOT be copied directly as primary public product surfaces
- public news portal
- public guides portal
- public compare-pathway tools
- public data portal pages
- generic public copilot/chat pages

---

## Frontend Product Surfaces

Primary active surfaces should center around:

- Home / AI Task Entry
- Scenario Entry Pages
- AI Answer Surface
- Tracker / Workspace
- Review / Delta / Handoff Surfaces
- Book Demo / Early Access

Public active product messaging should emphasize:
- AI helps answer your scenario questions
- AI helps reduce repetitive preparation work
- outputs can be saved into tracker/workspace
- the user can continue progressing the task/case

Do not position the product around:
- standalone assessments
- standalone comparisons
- standalone copilot tools

---

## AI Placement Rules

AI must not float outside the system as a generic assistant.

AI should be embedded into these layers:

1. Question Understanding
2. Public Knowledge Answering
3. Repetitive Work Automation
4. Material Interpretation Support
5. Structured Review Generation
6. Review Delta Generation
7. Handoff Intelligence

AI outputs must remain structured and actionable.

Avoid long, generic, freeform prose whenever a structured result is more appropriate.

---

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

---

## Primary Product Records

### Core entities
- profiles
- cases
- case_intakes
- case_documents
- case_review_versions
- case_review_deltas
- case_events
- app_events
- lead_requests

### Entity roles
- `profiles` are long-term context, not the primary product record
- `cases` are the primary execution record
- `case_documents` track material state
- `case_review_versions` track structured review history
- `case_review_deltas` track progress/change between reviews
- `case_events` track workflow progression
- `app_events` track funnel/product interaction
- `lead_requests` capture conversion intent

Legacy entities such as assessments, comparisons, and copilot threads may remain only for migration continuity and must never define new product architecture.

---

## Tracker / Workspace Rules

The tracker/workspace is a primary product surface.

It must function as:
- a place where AI outputs are saved
- a place where users continue work
- a place where material state is visible
- a place where review history is visible
- a place where next actions are obvious
- a place where export/handoff can happen

It must not degrade into:
- a generic dashboard
- a feature list
- a secondary afterthought to AI chat

---

## Language Requirements (Hard Requirement)

The full active product surface must support:
- Simplified Chinese (`zh-CN`)
- Traditional Chinese (`zh-TW`)

This is mandatory.

### Rules
1. Do not leave English hardcoded in active product surfaces.
2. All key product pages and states must support both Chinese variants.
3. AI outputs must support both `zh-CN` and `zh-TW`.
4. Language preference must be explicitly handled and persisted where appropriate.
5. Underlying schemas and business logic should remain stable and not be duplicated by language.
6. UI copy, action labels, empty states, errors, export packets, and AI-generated user-facing text must all respect the chosen Chinese language.

English, if retained at all, is secondary and must not drive architecture decisions.

---

## Knowledge Layer Rules

Knowledge support must remain internal-first.

Allowed internal knowledge structures include:
- processingTimeNote
- supportingContextNotes[]
- scenarioSpecificWarnings[]
- officialReferenceLabels[]

Knowledge refresh/update mechanisms should support current active wedge scenarios only.

Do not prematurely expose backend knowledge infrastructure as a public portal/search product.

---

## Current Supported Scenarios

Only the current wedge scenarios should be actively developed:

- Visitor Record
- Study Permit Extension

Do not add new public scenarios unless explicitly directed.

---

## Repetitive Work Automation Priority

This product must increasingly use AI to reduce repetitive work such as:
- structuring freeform notes
- interpreting material metadata/notes
- identifying likely missing materials
- generating/updating checklists
- generating review summaries
- generating delta summaries
- generating handoff packets
- prioritizing next steps

This is a primary product value, not a side feature.

---

## Event Intelligence Rules

Important workflow and funnel events should be captured cleanly.

### Case events examples
- case_created
- intake_started
- intake_completed
- materials_updated
- review_generated
- review_regenerated
- case_resumed
- export_clicked

### App events examples
- landing_cta_clicked
- use_case_cta_clicked
- start_case_selected
- review_cta_clicked
- dashboard_resume_clicked
- book_demo_clicked
- early_access_requested

Useful metadata should be included where practical, especially:
- useCase
- readinessStatus
- missingCount
- riskCount
- reviewVersion
- sourceSurface
- changedCount

Do not add noisy analytics for vanity purposes.

---

## Legacy / Migration Rules

Legacy assessment/comparison/copilot surfaces may remain only for migration continuity.

They must not:
- define active product architecture
- shape primary navigation
- shape primary dashboard metrics
- shape homepage messaging
- shape future AI strategy

Legacy code should be isolated clearly under legacy/archive paths where practical.

Examples:
- `lib/legacy/*`
- `components/legacy/*`

If a function/module still exists only for continuity, make that explicit in naming and placement.

---

## Engineering Rules

1. Preserve stable auth, storage, upload flow, export packet, and current workspace flow.
2. Keep ownership filtering explicit in all queries.
3. Keep AI server-side.
4. Keep deterministic fallback available whenever AI or knowledge enhancement is involved.
5. Prefer typed, maintainable, production-minded code.
6. Do not over-engineer abstractions.
7. Output full file contents for modified files when asked for code changes.
8. Avoid unnecessary scope widening.
9. Every new feature must reinforce the task + tracker/workspace + public-information-answering model.

---

## Current Strategic Priorities

The current priorities are:

1. keep the active product fully case/task/workspace coherent
2. strengthen AI-driven repetitive-work reduction
3. strengthen public-information-backed answers
4. strengthen tracker/workspace progression
5. strengthen review delta and handoff quality
6. support full-site Simplified + Traditional Chinese
7. strengthen knowledge refresh/update infrastructure
8. avoid portal sprawl

---

## What Not To Build Now

Do not build now:
- public news portal
- public data portal
- public compare-pathway tools
- broad public copilot
- large guide/content library
- additional public use cases
- complex admin systems
- payment-first expansion
- broad multi-role platform logic
- any feature that widens the frontend faster than the workflow/AI execution core can support

---

## Implementation Bias

When choosing between:
- adding more public surface area
- or making the task/workspace/AI-execution loop stronger

always choose the latter unless explicitly instructed otherwise.

When choosing between:
- exposing more Immi frontend concepts
- or absorbing Immi backend capability into Tideus

always choose backend capability absorption.

When choosing between:
- freeform AI output
- or structured actionable output

always choose structured actionable output.

---

## Current North Star

The product should feel like:

**an AI-driven task assistant that uses public information and user/case context to answer questions, reduce repetitive work, and continuously update a tracker/workspace that helps the user move forward.**
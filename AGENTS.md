# AGENTS.md

## Project Identity
Tideus is NOT a generic AI immigration site.

Tideus is a focused AI-powered workflow + case workspace for high-frequency, relatively rules-clear, document-heavy application/extension preparation scenarios.

Phase 1 wedge scenarios:
- Visitor Record preparation
- Study Permit Extension preparation

The product helps users:
- organize materials
- detect missing items
- identify common risks
- understand next steps
- save and continue a case
- prepare a review-ready case before speaking with a professional

It does NOT:
- provide legal advice
- replace licensed professionals
- act as a universal immigration assistant
- try to cover all immigration categories
- prioritize generic chat experiences

## Core Product Principle
Front-end clarity, back-end workflow moat.

Every major product decision must support:
1. a clearer user-facing wedge
2. structured workflow steps
3. reusable case records
4. future system-of-record foundations

## Product Shape
The primary product is case-first, not tool-first.

Primary user flow:
1. User selects a supported scenario
2. User starts a case
3. User fills intake
4. User uploads or marks documents
5. System generates structured review output
6. User saves and resumes the case

## Required Output Shape
Do not design outputs as long AI essays.

Preferred outputs:
- readiness status
- checklist
- missing items
- risk flags
- next steps
- timeline
- export-ready summary

## Current Product Scope
Phase 1 pages should focus on:
- Home
- How It Works
- Use Cases
- Use Case detail page(s)
- Start a Case
- Case Intake
- Upload Materials
- Review Results
- Case Dashboard
- Trust & Boundaries
- Waitlist / Book Demo
- Auth

## What Must Be De-emphasized or Removed
Do not position the product around:
- Assessment as a standalone surface
- Compare as a standalone surface
- Copilot as a standalone surface
- generic AI chat
- broad immigration planning language
- “we support everything” messaging

Legacy structures may be reused internally, but the public product must center around cases and workflows.

## Data Model Direction
The product must move toward these core entities:
- cases
- case_intakes
- case_documents
- case_reviews
- case_events

Existing tables and logic may be adapted, but future work should prioritize case-centric persistence over tool-centric persistence.

## Moat Stack Requirements
All implementation choices should help build:
1. clear and demo-friendly front-end positioning
2. structured workflow logic
3. process data capture
4. case record foundations
5. future human-in-the-loop handoff capability
6. distribution-ready product surfaces

## Engineering Rules
1. Preserve stable existing auth, layout, and reusable UI foundations.
2. Refactor aggressively where the product direction is wrong.
3. Do not over-engineer abstractions.
4. Prefer maintainable, typed, production-minded code.
5. Always provide full file contents for modified files.
6. Keep ownership filtering explicit in data queries.
7. All major forms must have validation, loading, success, and error states.
8. Keep the UI premium, focused, simple, and easy to demo.

## Current Priority
Current priority is NOT feature expansion.

Current priority is:
- product repositioning
- information architecture refactor
- case-first data model introduction
- wedge workflow implementation

Do not add:
- CMS
- blog/news portal
- broad search
- payment
- complex multi-role admin
- generic chatbot-first UX

## Legacy Surface Rule
Legacy routes and data models for assessments, comparisons, and copilot may remain temporarily for migration continuity, but they are no longer primary product surfaces.

They must not:
- drive homepage messaging
- appear as primary navigation
- define the product architecture going forward

## Case System Rule
The `cases` domain is now the primary product record.
All new workflow features should attach to case-centric records first, not to standalone tool-centric histories.

## Current Refactor Bias
When choosing between:
- preserving old tool abstractions
- or strengthening the case workflow

always prefer the case workflow, unless preserving the old abstraction is required for migration safety.
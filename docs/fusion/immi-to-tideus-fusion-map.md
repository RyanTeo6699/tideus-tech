# Immi-to-Tideus Fusion Map

## Purpose

This document defines the formal boundary for absorbing backend capability patterns from the latest local ImmiPilot codebase into Tideus.

Inspected source codebase:

- `/Users/ryan/Documents/immi-pilot-main`

Tideus remains the workflow-first frontend product shell. ImmiPilot contributes backend-only capability patterns that can improve public-information-backed answers, structured review output, processing-time notes, rule checks, and future internal knowledge refresh. ImmiPilot frontend pages, public portal routes, public dashboards, public comparison tools, and generic copilot surfaces must not be merged into the active Tideus frontend.

## Product Boundary

Tideus must stay:

- workflow-first
- task-oriented
- case-aware
- structured-output-first
- AI-enhanced
- tracker/workspace-backed
- handoff-ready

Immi fusion is valid only when the absorbed capability enters the Tideus workflow through a saved case, case-scoped question, materials workflow, structured review, review delta, export packet, or handoff record.

Immi fusion is invalid when it creates standalone public browsing, public data exploration, public comparison, public news, broad guide, or generic copilot experiences.

## Current Tideus Landing Zones

| Tideus module | Role | Fusion rule |
| --- | --- | --- |
| `lib/knowledge/` | Scenario knowledge packs, official reference labels, processing-time notes, source freshness, and structured workflow context. | Accept backend knowledge payloads only for supported Tideus scenarios. Do not expose packs as public content pages. |
| `lib/public-info/` | Internal source descriptors, processing-time reference metadata, and future retrieval source contracts. | Accept public-information source metadata for workflow use only. Do not create public data/news/search routes. |
| `lib/review-rules/` | Deterministic rule and condition helpers for checklist, missing item, risk flag, priority action, and escalation trigger generation. | Accept rule patterns only when they feed Tideus structured outputs. Do not build standalone assessment or compare tools. |
| `docs/fusion/` | Governance documents for Immi-to-Tideus fusion decisions. | Record what may be absorbed, what must wait, and what is excluded. |
| `app/api/internal/knowledge/refresh/route.ts` | Existing internal refresh endpoint. | May later receive scenario-scoped refresh payloads. Must remain internal-only. |

## Absorb Now

These Immi backend capability groups are suitable to absorb now because they directly strengthen Tideus workflow outputs without adding frontend scope.

| Capability group | ImmiPilot source references | Tideus connection point | Absorption shape |
| --- | --- | --- | --- |
| Scenario knowledge packs | `backend/services/visitor_checklist_engine.py`, `backend/services/checklist_engine.py`, `frontend/src/utils/visitorRecordEngine.js`, `frontend/src/utils/spExtensionEngine.js` | `lib/knowledge/scenarios/visitor-record.ts`, `lib/knowledge/scenarios/study-permit-extension.ts`, `lib/knowledge/packs.ts`, `lib/case-workflows.ts` | Convert useful material expectations, scenario warnings, and localized reference notes into Tideus pack fields for Visitor Record and Study Permit Extension only. Do not add new public scenarios. |
| Processing time knowledge | `backend/routes/processing_routes.py`, `scraper/config/processing_times.yaml`, `scripts/seed_processing_times.py` | `lib/public-info/`, `lib/knowledge/types.ts`, `lib/knowledge/adapter.ts`, `lib/knowledge/refresh.ts` | Preserve source label, source URL, notes, freshness, and last-verified style metadata as internal `processingTimeNote` context. Use `live-check-required` freshness unless Tideus has an official verified refresh record. Do not add a public processing-time page. |
| Rule and condition libraries | `backend/services/visitor_risk_engine.py`, `backend/services/checklist_engine.py`, `backend/services/eligibility_engine.py`, `scraper/config/pathway_rules.yaml` | `lib/review-rules/`, `lib/case-review.ts`, `lib/case-ai.ts`, `lib/case-workflows.ts` | Extract deterministic condition patterns that can produce Tideus `checklist`, `missingItems`, `riskFlags`, `priorityActions`, `issuesNeedingHumanReview`, and `escalationTriggers`. Do not port pathway comparison scoring or public eligibility UI. |

## Absorb Later

These Immi backend capability groups are useful, but should wait until Tideus has stable scenario packs, deterministic review rules, and stricter source governance.

| Capability group | ImmiPilot source references | Future Tideus connection point | Delay reason |
| --- | --- | --- | --- |
| Retrieval and reranking support | `backend/rag/search_service.py`, `backend/rag/reranker.py`, `backend/rag/vector_store.py`, `backend/rag/sources/*` | Future server-only modules under `lib/public-info/` or `lib/knowledge/` | Retrieval must be scenario-scoped, source-labeled, and workflow-serving before use. It must not become public search, broad RAG chat, or a generic copilot. |
| Knowledge refresh pipeline | `backend/rag/sync_knowledge_base.py`, `backend/rag/kb_freshness.py`, `scraper/knowledge/*`, `scraper/config/data_sources.yaml`, `scripts/sync_knowledge.sh` | Existing `/api/internal/knowledge/refresh`, `lib/knowledge/refresh.ts`, future source registry under `lib/public-info/` | Tideus already has a narrow internal refresh path. Broader crawl, freshness, and reindex orchestration should be added only after source scope and official-reference rules are explicit. |

## Exclude From Tideus Frontend Now

The following Immi capabilities and surfaces must not be merged into the active Tideus frontend during this phase.

| Excluded surface | ImmiPilot source references | Tideus decision |
| --- | --- | --- |
| Public news portal | `frontend/src/pages/NewsPage.jsx`, `frontend/src/pages/NewsDetailPage.jsx`, `scraper/news/*`, generated `frontend/dist/news/*` | Do not create Tideus news pages, feeds, article detail pages, or public content browsing. News-like source updates may only inform internal knowledge refresh after review. |
| Public data portal | `frontend/src/pages/DataPage.jsx`, public statistics dashboards, generated `frontend/dist/data/*` | Do not add public dashboards, public datasets, or exploratory charts. Data may only support workflow outputs internally. |
| Public compare tools | `frontend/src/pages/ComparePathwaysPage.jsx`, `backend/routes/comparison_routes.py`, `backend/services/eligibility_engine.py`, generated `frontend/dist/compare/*` | Do not restore or expand public comparison UX. Rule logic may be harvested only as internal review-rule patterns for current Tideus scenarios. |
| Public copilot | `frontend/src/pages/CopilotPage.jsx`, `frontend/src/pages/CopilotHealthPage.jsx`, `frontend/src/pages/SharedChatPage.jsx`, `frontend/src/components/copilot/*`, `backend/routes/shared_chat_routes.py`, `backend/rag/copilot.py` | Do not add generic public chat, shared chat, copilot health, or broad RAG chat surfaces. Tideus AI must remain embedded in case questions and workflow actions. |
| Public processing-time page | `frontend/src/pages/ProcessingTimePage.jsx`, public `/api/processing-times/*` comparison endpoints | Do not add public processing-time lookup or comparison. Processing-time knowledge may appear only as internal workflow notes with official reference labels. |
| Public guide and scenario portals beyond current wedge | `frontend/src/pages/GuidePage.jsx`, `frontend/src/pages/StreamGuidePage.jsx`, `frontend/src/pages/ScenariosIndexPage.jsx`, broad stream/scenario pages | Do not broaden Tideus public scope. Tideus remains limited to Visitor Record and Study Permit Extension unless a future sprint explicitly adds a scenario. |

## Integration Rules

1. No Immi frontend route, component, static build output, public portal page, public guide page, public dashboard, public compare page, or public copilot page may be copied into Tideus.
2. Any absorbed capability must land first in an internal module boundary: `lib/knowledge/`, `lib/public-info/`, or `lib/review-rules/`.
3. Any user-facing output produced from absorbed knowledge must support both `zh-CN` and `zh-TW`.
4. Any AI use must remain server-side and strict-schema where it affects workflow output.
5. Deterministic fallback must remain available when AI, retrieval, refresh, or source parsing is unavailable.
6. Absorbed processing-time information must carry a source label and freshness indicator. It must not imply live official status unless the source was verified through the Tideus refresh path.
7. Broad Immi pathway logic can inform internal conditions only. It must not redefine Tideus product scope or add unsupported scenarios.
8. Workflow outputs must remain structured. Prefer fields such as `summary`, `readinessStatus`, `checklist`, `missingItems`, `riskFlags`, `nextSteps`, `timelineNote`, `supportingContextNotes`, `officialReferenceLabels`, `priorityActions`, `externalSummary`, `reviewReadyStatus`, `issuesNeedingHumanReview`, and `escalationTriggers`.

## Phased Fusion Plan

### Phase 1: Current

- Keep the Tideus frontend unchanged.
- Use this document as the formal map for future fusion.
- Preserve existing `lib/knowledge/` seed-pack and refresh architecture.
- Add internal landing-zone documentation for `lib/public-info/` and `lib/review-rules/`.

### Phase 2: Backend Capability Absorption

- Normalize scenario knowledge pack patterns for Visitor Record and Study Permit Extension.
- Move processing-time reference contracts into internal public-info helpers.
- Extract deterministic rule and condition patterns into `lib/review-rules/`.
- Wire rules only into case-scoped review and handoff outputs.

### Phase 3: Retrieval And Refresh

- Add server-only retrieval and reranking contracts only after source governance is strict.
- Add internal source registry and freshness metadata for supported scenarios.
- Extend the existing internal refresh route rather than adding public source pages.

### Phase 4: Future B-side Support

- Expose only workflow-derived outputs to the professional operational backend.
- Use handoff records, review-ready status, human-review issues, and escalation triggers as the bridge.
- Do not expose raw public-info crawl, broad search, or portal data to professional users unless it is attached to a case workflow.

## Acceptance Checklist

- Tideus frontend product shell remains workflow-first.
- No Immi public frontend pages are merged.
- No public news, data, compare, broad guide, processing-time lookup, or generic copilot surfaces are added.
- Immi capability groups are classified as absorb now, absorb later, or exclude.
- Future code has clear landing zones in `lib/knowledge/`, `lib/public-info/`, and `lib/review-rules/`.
- The mapping preserves the current supported public scenarios: Visitor Record and Study Permit Extension.

# Review Rules Boundary

`lib/review-rules/` is the internal landing zone for deterministic rule and condition helpers that support Tideus structured workflow outputs.

This directory exists to keep future rule absorption from ImmiPilot-style backend engines separate from public UX, broad pathway comparison, and standalone assessments.

Allowed future responsibilities:

- condition helpers for `checklist`
- missing item rules for `missingItems`
- risk condition helpers for `riskFlags`
- priority action rules for `priorityActions`
- handoff and escalation conditions for `issuesNeedingHumanReview` and `escalationTriggers`
- deterministic fallback logic used before or after AI enrichment

Not allowed here:

- public eligibility comparison engines
- broad pathway scoring products
- generic assessment UX
- new scenario activation without explicit product approval
- legal-advice-style recommendations

Rules in this directory must remain scenario-scoped to active Tideus workflows unless a future sprint explicitly expands supported scenarios.

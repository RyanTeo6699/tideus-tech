# Public Info Boundary

`lib/public-info/` is the internal landing zone for public-information source metadata that supports Tideus workflow outputs.

This directory is not a public data portal. It must not define public pages, public search, public news feeds, public processing-time lookup, or public comparison tools.

Allowed future responsibilities:

- source descriptors for official or reviewed public references
- processing-time reference contracts used by `lib/knowledge/`
- source freshness and last-verified metadata
- server-only retrieval source contracts when retrieval is added later
- labels that can flow into `officialReferenceLabels`

Not allowed here:

- frontend route definitions
- broad public datasets or dashboards
- generic web search UX
- public RAG/copilot interfaces
- unsupported scenario expansion

Any user-facing output derived from this directory must enter an existing Tideus workflow surface and support both `zh-CN` and `zh-TW`.

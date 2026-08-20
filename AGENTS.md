# Repository Instructions

## Goal

Maintain a deterministic, evidence-linked Korean factory-permit decision-support dashboard. It is not a permit issuer or legal-advice system.

## Structure

- `app/components/dashboard`: wizard, swimlane, detail drawer and supporting views
- `app/api/law`: server-only law search/status routes
- `data/catalog`: versioned procedures, edges, rules, sources, citations, durations and coverage
- `data/scenarios`: golden regression inputs
- `data/snapshots/law-api`: reviewed fallback metadata
- `lib/domain`: Zod schemas and normalized facts
- `lib/engine`: applicability and scheduling engines
- `lib/law-api`: external adapter, snapshot and change detector
- `tests`: unit, integration, UI, fixtures and E2E
- `docs`: product, architecture, methodology and ADRs

## Required checks

Run before proposing a change:

```bash
npm run lint
npm run typecheck
npm test
npm run build:next
```

Run `npm run test:e2e` when UI behavior, URL state, accessibility, official links or responsive layout changes.

## Catalog edit rules

1. Keep stable, descriptive string IDs. Never renumber published IDs.
2. Validate all JSON through `lib/data/catalog.ts`; no executable expressions in data files.
3. Each confirmed rule must cite a `LegalCitation`; each citation must point to a `LegalSource` and official HTTPS URL.
4. Store `lawId`, `mst`, article identifiers and date-like API values as strings so leading zeroes survive.
5. Separate legal confidence from duration-estimate confidence.
6. Do not invent a duration. Use `null`, `INSUFFICIENT_DATA` and a visible warning when evidence is absent.
7. Treat deeming as an auditable relation. It requires the underlying application documents and interagency consultation; never label it automatic approval.
8. Update or add golden scenarios for threshold, exception, jurisdiction, date or branch changes.
9. Never auto-promote a draft after API change detection. A human must inspect the source, citation, rule and tests.

## Forbidden changes

- Never commit `LAW_API_OC`, `.env.local`, cookies, tokens or raw sensitive upstream responses.
- Never expose the API identifier in browser bundles, query strings, public links or logs.
- Never infer an environmental/safety permit solely from an industry label.
- Never convert business days to calendar days without a reviewed holiday calendar.
- Never describe a partial critical-path calculation as total project duration.
- Never mark local ordinance or industrial-complex plan coverage complete without collecting the named jurisdictional source.

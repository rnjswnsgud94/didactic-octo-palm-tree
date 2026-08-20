# Data model

All production catalog documents are JSON validated by Zod. IDs and dates are explicit strings; numeric values always carry an understood unit.

## Project facts

Each input is a `Fact`:

| Field | Meaning |
|---|---|
| `status: KNOWN` | A supplied value may be used by rules |
| `status: UNKNOWN` | The system must request or flag more information |
| `status: NOT_APPLICABLE` | The dimension does not apply; it is not missing |
| `value` | String, number, boolean, string array or null |
| `unit` | Explicit unit such as `m2`, `MW`, `m3/day` |
| `source`, `checkedAt` | Optional provenance |

`ProjectInput` groups assessment date, investment type, location, industrial complex, industry, site, building, environment, safety, utilities, coordination and known approvals.

## Procedure catalog

`Procedure` is stable content: stage, lane, action, applicant, receiving/decision/consultation authorities, submissions, outcome, follow-up obligations, citation and duration references, verification state and deeming relations.

## Rule AST

`ApplicabilityRule` separates policy from code. A condition is recursively composed from `all`, `any`, `not`, `eq`, `in`, `intersects`, comparison, range and existence nodes. Rules also store effective dates, jurisdiction, required facts, effect, priority, citations, review actor and status.

Rule effects are `INCLUDE`, `EXCLUDE`, `REPLACE` and `SPECIAL_CASE`. A higher-priority explicit exclusion wins. Equal-priority include/exclude matches are surfaced as a conflict, never silently resolved.

## Graph

`ProcedureEdge` references two procedures and records:

- relation: finish-to-start, start-to-start or finish-to-finish;
- non-negative lag and its unit;
- strength: legal hard, practical or advisory;
- optional condition/branch, citations and note.

The catalog must be acyclic. Mutually exclusive applicability rules select industrial-complex and off-site completion branches.

## Legal evidence

`LegalSource` records title, document type, issuing authority, jurisdiction, law ID/MST, proclamation/effective/repeal dates, retrieval/verification time, hash, official URL and source status.

`LegalCitation` records article/paragraph/subparagraph/item, its role, source version and a short paraphrase. The source version used for a decision is therefore independently auditable.

## Duration

`DurationEstimate` separately records applicant preparation, authority processing, interagency consultation and elapsed time. Each range has min/base/max and one unit. Evidence type, citation, sample size, assumptions, stop-clock rules, variability factors, verified date, legal confidence and estimate confidence are independent fields.

When reliable evidence is absent, duration components are `null` and evidence is `INSUFFICIENT_DATA`.

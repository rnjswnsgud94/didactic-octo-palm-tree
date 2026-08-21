# ADR 0002: Official-duration dependency schedule

Status: accepted; user-duration paragraph superseded by ADR 0004 (2026-08-22)

## Decision

Use an acyclic procedure graph and date-level critical-path calculation for two automatic scenarios: `MIN` and `TYPICAL`. Preserve each official duration unit, resolve input-dependent statutory branches, and calculate Korean business days with a reviewed 2026–2040 public-holiday calendar. Construction is a calendar-month interval that may absorb parallel procedures. ADR 0004 adds a separately labelled, reversible `USER` overlay without changing the official catalog.

## Rationale

Adding every permit duration would overstate work that can run in parallel. Asking users to invent phase durations would merely move the calculation problem into the input form. Official processing periods and explicit dependencies provide an auditable lower-bound schedule while preserving unknowns.

## Consequences

The UI shows `총 소요기간` only when every operation-ready path has a usable official duration. Otherwise it shows `확인된 일정 하한`, leaves `totalCalendarDays=null`, and identifies the procedures with no nationwide common period. Applicant preparation, supplements, temporary holidays, election days, resource constraints and construction procurement remain outside the automatic authority-processing calculation and are disclosed. Post-operation work is reported separately.

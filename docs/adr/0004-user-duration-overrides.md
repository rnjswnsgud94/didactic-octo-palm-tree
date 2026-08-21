# ADR 0004: User expected-duration overlay

Status: accepted (2026-08-22)

## Decision

Allow a user to enter an expected end-to-end duration for an individual roadmap procedure. Store it separately from the legal and official duration catalog and apply it only in the explicit `USER` schedule scenario. A user value means the user's expected total elapsed time for that procedure, including preparation, supplements and consultation. Preserve its original unit (`BUSINESS_DAY`, `CALENDAR_DAY`, or `MONTH`) and never convert it into an official average.

Official minimum and official-basis schedules remain unchanged. In the user scenario, a completed checkpoint takes priority, then a valid user value, then the official basis. If a user value fills an official duration gap, the schedule may become calculable, but official missing-duration and incomplete-component metadata remains visible. Clearing the value restores the official calculation immediately.

## Rationale

Official processing periods often exclude document preparation, supplements, committee scheduling, consultation and field-inspection reservations. A project team can have better project-specific evidence for those intervals. A separate overlay lets the team test a realistic plan without presenting its assumptions as statute or agency performance data.

## Consequences

The roadmap cards identify user values as `사용자 예상`, summaries disclose how many values were applied, and warnings state that they are neither statutory periods nor official averages. Values are included in versioned share URLs and input codes, bounded to 250 procedures and 0–3,650 whole units. Business days use the reviewed Korean holiday calendar; calendar days and months retain their own arithmetic. Values for excluded procedures are preserved but do not affect the current result.

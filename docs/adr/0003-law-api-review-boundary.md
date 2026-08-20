# ADR 0003: Law API behind a human-review boundary

Status: accepted

## Decision

Use the National Law Information API only from the server for discovery and change detection. A reviewed snapshot supports degraded operation. API changes generate impacted source/citation/rule IDs but never edit production decisions automatically.

## Rationale

API availability and schema shape vary by target, and text changes require legal interpretation. Automatic rule rewrites could silently change public decision support.

## Consequences

The deployment needs a secret and registered access context for live mode. Snapshot dates and warnings are user-visible. Catalog promotion always requires human review and regression tests.

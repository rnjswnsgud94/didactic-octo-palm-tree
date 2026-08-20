# ADR 0001: Declarative four-state applicability

Status: accepted

## Decision

Store applicability conditions as validated JSON AST and evaluate them with three-valued internal truth into four user-facing statuses. Rules carry dates, jurisdiction, priority, citations and review state.

## Rationale

Permit logic changes more frequently than UI code and must be auditable in Git diff. A boolean would turn missing facts into false negatives and hide conflicts. Code-only conditionals would make legal review difficult.

## Consequences

Catalog validation and rule traces are mandatory. New operators require schema, evaluator and test changes. A matched procedure with `TODO_LEGAL_REVIEW` remains only `POSSIBLY_APPLIES`.

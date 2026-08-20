# ADR 0002: Partial dependency-based schedule

Status: accepted

## Decision

Use an acyclic procedure graph and CPM-style earliest/latest/slack calculation for minimum, base and maximum duration scenarios. Include legal-hard edges by default and let users include practical edges.

## Rationale

Adding every permit duration overstates serial work. CPM represents parallel branches, but a permit catalog lacks construction, resource and holiday information.

## Consequences

The UI calls the result a partial schedule, never total project duration. Unknown duration remains `null` and causes an incomplete warning. Business-day/calendar-day conversion is prohibited without a reviewed calendar.

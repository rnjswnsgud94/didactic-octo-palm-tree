# Product specification

## Problem

Factory investment teams currently assemble permit paths from statutes, civil-service pages, local rules and agency consultations. A single checklist hides jurisdiction, conditionality, deeming and parallel work, so teams can mistake a generic item for a legally required step or add all durations sequentially.

## Product outcome

Given explicit project facts and an assessment date, the dashboard returns:

- a four-state decision for every catalog procedure;
- an institution-by-stage swimlane with excluded procedures available on demand;
- a decision explanation, missing facts and direct official citations;
- separate minimum, base and maximum partial schedules;
- coverage, snapshot health, assumptions and unverified items.

The output is a review aid, not a filing, administrative disposition or legal opinion.

## MVP users

- central and local government investment-support officers;
- industrial-complex management agencies;
- factory investment, engineering, EHS and legal teams;
- advisers preparing permit roadmaps.

## Input flow

1. Project: investment type, assessment date, province/city, industrial-complex status, industry family.
2. Facility: building action; existing, incremental and post-project factory-building area; deemed-permit coordination class.
3. Environment and safety: user-confirmed air/water facility status, chemical handling and PSM coverage.
4. Infrastructure: incremental power, water and wastewater demand.

Unknown facts remain unknown. “No” and “not applicable” are not substitutes for missing information.

## Output behavior

- `APPLIES`: a reviewed include/special-case rule matches.
- `DOES_NOT_APPLY`: no include rule matches or a higher-priority explicit exclusion wins.
- `POSSIBLY_APPLIES`: rules conflict, active rules are absent, or a matching procedure still requires legal review.
- `NEEDS_MORE_INFO`: a required fact is unknown and the truth value cannot be resolved.

Status is conveyed through label, symbol, border and pattern—not color alone. The UI supports search, required-only, conditional inclusion, practical dependencies, excluded procedures, lane collapse, scenario presets, URL sharing, reset and print.

## Success criteria

- identical input, date and catalog version produce identical output;
- 499/500/501㎡ boundaries and industrial-complex deeming are regression-tested;
- every confirmed threshold, institution and duration links to official evidence;
- unverified legal or duration claims are visibly downgraded;
- no cycles or missing references enter the procedure graph;
- desktop, mobile, keyboard and print states remain usable.

## Non-goals

The MVP does not file applications, make final legal determinations, forecast construction, optimize staffing, or automatically cover all local ordinances, site restrictions, chemical thresholds, hazardous-material, gas, fire and electrical inspections.

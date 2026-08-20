# National Law Information Open API

## Configuration

Set `LAW_API_OC` only as a server secret. The client code never receives it.

The adapters use the fixed origin `https://www.law.go.kr`, list endpoint `/DRF/lawSearch.do` and body endpoint `/DRF/lawService.do`. Supported allowlisted list targets are:

| Target | Expected root | Use |
|---|---|---|
| `eflaw` | `LawSearch` | current/effective laws |
| `law` | `LawSearch` | law search |
| `admrul` | `AdmRulSearch` | administrative rules |
| `ordin` | `OrdinSearch` | local ordinances |

IDs, MST, dates and proclamation numbers are parsed as strings. XML tag-value number conversion is disabled to retain leading zeroes. Single objects and arrays normalize to the same document array.

Body targets are `eflaw`, `eflawjosub`, `law`, `lawjosub`, `admrul` and `ordin`. Each target accepts only its documented family of response roots (`법령`/`LawService`, `AdmRulService`, `OrdinService`/`자치법규`). Scheduled synchronization also supports the official change/deletion target names `lsHstInf`, `lsJoHstInf` and `delHst`. Targets that return HTML only are deliberately excluded from the JSON/XML adapter.

## Defensive behavior

- Zod target validation and 80-character query cap;
- hard-coded HTTPS host/path and URL encoding;
- maximum 100 records/page, 20 pages and 5 MB/response;
- 6 second overall timeout and bounded retry for network, 429 and 5xx errors;
- local 20 requests/minute guard and 15 minute in-memory cache;
- detection of HTTP-200 `{result,msg}`, empty body, wrong target root and invalid pagination;
- no upstream response body or credential in surfaced errors;
- public document links contain only the Korean document category and title.

## Snapshot fallback

Without `LAW_API_OC`, or after any live failure, the adapter returns `mode: SNAPSHOT`, verification dates and warnings. The committed snapshot currently contains only public-page-verified metadata, not downloaded API bodies. It must not be represented as live or complete.

## Change review

`detectLawChanges` compares source hash, effective date and proclamation number, then resolves impacted citations and rules. Its output is an impact report and review checklist. It never mutates the rule catalog.

## Operations checklist

1. Register the deployment IP/domain and obtain the organization’s OC according to the official API guide.
2. Set the secret in the deployment environment; never commit it.
3. Query relevant targets and persist only reviewed, necessary metadata/content.
4. Run change detection and inspect affected sources/citations/rules.
5. Update legal summaries, versions and regression tests in one reviewed pull request.
6. Advance `verifiedAt` and `nextReviewDueAt` only after human verification.

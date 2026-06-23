# Design: Placements Date-Range Report

## Technical Approach

Read-only report over `vacancy_status_history`. One repository method runs a single
parameterized, tenant-scoped raw SQL query that returns the placement rows
(DISTINCT vacancy, joined to `vacancy`/`client`/`user`), from which the use case
derives totals + three breakdowns in memory. No schema change. Full DDD stack per
the proposal: repo method → use case → server action → query hook → page. Mirrors
the existing `getPaginatedVacanciesAction` auth→tenant→permission→use case→result flow.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Aggregation engine | `prisma.$queryRaw` (`Prisma.sql` tagged template) | DISTINCT vacancyId + JOIN to `vacancy.isWarranty`/`client`/`user` exceed Prisma `groupBy`. One typed raw query is simplest and correct. First `$queryRaw` in application/repository code; precedent in `scripts/backfill-client-normalized-nombre.ts` (uses safe `Prisma.sql` tagged templates). |
| Query count | One query returning the detailed placement list; breakdowns computed in the use case (TypeScript) | A placement set is small (one tenant, one month default). Aggregating in TS avoids 4 round-trips and keeps SQL trivial. Distinct handled via `DISTINCT ON (sh."vacancyId")`. By-month bucket MUST be derived from `placedAt` using UTC extraction (`placedAt.toISOString().slice(0,7)` for YYYY-MM); `Date.prototype.getMonth()`/`getFullYear()` (local-time methods) are FORBIDDEN. This guarantees `byMonth` sums to `gross` under the same UTC basis as the range filter. No SQL-side `DATE_TRUNC` — all month bucketing happens in the use case. |
| Distinct placement | `DISTINCT ON (sh."vacancyId") ... ORDER BY sh."vacancyId", sh."createdAt" DESC` | A vacancy can reach PLACEMENT twice (PRE_PLACEMENT→ and FOLLOW_UP→). Count each vacancy once; keep the LATEST (most recent) in-range transition. The canonical placement date (`placedAt`) = the latest in-range PLACEMENT transition for that vacancy, making by-month attribution deterministic. |
| Timezone | UTC; half-open interval `[from 00:00Z, toExclusive 00:00Z)` | Simplest correct option, no tenant-tz infra exists. Client sends ISO dates; use case sets `from`=start-of-day UTC and `toExclusive`=start-of-day-after-`to` (UTC), avoiding off-by-one. Documented as a known limitation. |
| Range validation | Use case rejects `from > to` with validation error; single-day (`from == to`) works via `toExclusive = from + 1 day` | Inverted ranges are a caller bug — never silently return zero. Single-day is valid and produces a 1-day half-open window. |
| Recruiter dimension | `vacancy."recruiterId"` → `user.name` | Recruiter = the ASSIGNED recruiter on the vacancy (`Vacancy.recruiterId`, non-null FK onDelete: Restrict), NOT who confirmed the transition. JOIN `vacancy."recruiterId" = user.id` always resolves. |
| Date-range UI | Two `DatePicker`s (Desde/Hasta) with min/max linkage | Matches existing `VacancySheetFilters` pattern; no dual-calendar component in repo. |
| Index | None added | Existing `vacancy_status_history(createdAt)` and `(vacancyId, createdAt)` cover the filter; the filtered set is small. |

## Data Flow

    ReportPage (PermissionGuard) ─→ usePlacementsReportQuery
         │  {from,to ISO}                    │ getPlacementsReportAction
         ▼                                   ▼
    DatePickers + Summary/Breakdown/List ◄── GetPlacementsReportUseCase
                                             │ (totals + breakdowns in TS)
                                             ▼
                          PrismaVacancyStatusHistoryRepository.getPlacementsReport
                                              │ $queryRaw (tenant-scoped)
                                              ▼  vacancy_status_history ⋈ vacancy ⋈ client ⋈ user(vacancy.recruiterId)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `…/domain/interfaces/IVacancyStatusHistoryRepository.ts` | Modify | Add `getPlacementsReport(p: {tenantId; from: Date; toExclusive: Date}): Promise<PlacementRow[]>` + `PlacementRow` type |
| `…/infrastructure/repositories/PrismaVacancyStatusHistoryRepository.ts` | Modify | Implement via `prisma.$queryRaw` (DISTINCT ON, joins, tenant-scoped params) |
| `…/application/use-cases/GetPlacementsReportUseCase.ts` | Create | Compute UTC bounds, totals (gross/net/warranty), 3 breakdowns; return DTO |
| `…/presentation/actions/getPlacementsReport.action.ts` | Create | auth→tenant→`reportesReclutamiento.acceder`→use case→result |
| `…/frontend/hooks/usePlacementsReportQuery.ts` | Create | `useQuery` key `["placements-report", tenant?.id, from, to]` |
| `…/frontend/types/vacancy.types.ts` | Modify | Add report DTO types |
| `…/frontend/pages/PlacementsReportPage.tsx` + `components/` | Create | Date range, summary card, breakdown tables, detail list |
| `…/reclutamiento/reportes/page.tsx` | Modify | Render `PlacementsReportPage` |

## Interfaces / Contracts

Dates cross the boundary as ISO strings.

```ts
interface PlacementRow { vacancyId; position; clientId; clientName; recruiterId;
  recruiterName: string; isWarranty: boolean; placedAt: Date } // repo-internal; recruiterName non-null (Vacancy.recruiterId FK non-null, onDelete: Restrict)
interface PlacementsReportFilters { from: string; to: string } // inclusive day, UTC
interface BreakdownRow { key: string; label: string; gross: number; net: number; warranty: number }
interface PlacementListRow { vacancyId; position; clientName; recruiterName: string;
  isWarranty: boolean; placedAt: string /*ISO*/ }
interface PlacementsReportDTO {
  filters: PlacementsReportFilters;
  summary: { gross: number; net: number; warranty: number };
  byMonth: BreakdownRow[]; byClient: BreakdownRow[]; byRecruiter: BreakdownRow[];
  list: PlacementListRow[];
}
```

## Invariants

- **Net invariant**: `gross = COUNT(DISTINCT vacancyId)`; `warranty` = subset where `Vacancy.isWarranty = true`; `net = gross − warranty`. For EACH breakdown row (byMonth, byClient, byRecruiter): `row.gross = row.net + row.warranty`. All counts are computed from the same distinct-collapsed vacancy list, partitioned by the dimension key.

## Testing Strategy

No test framework (per session preflight). Verification = `bun run build` + `bun run lint`
baseline parity. Manual: compare report count for a date range against a direct DB
`SELECT COUNT(DISTINCT "vacancyId")` to confirm correctness (Success Criteria).
Manual invariant check: assert `sum(byX.gross) == summary.gross` for all three breakdowns (byMonth, byClient, byRecruiter) — if any mismatch, the bucketing logic has a bug.

## Implementation Guardrails

- **$queryRaw safety**: Use `Prisma.sql` tagged template ONLY — never `$queryRawUnsafe`, never string-concatenated identifiers. All camelCase Postgres columns MUST be double-quoted (e.g. `sh."vacancyId"`, `v."isWarranty"`). Static SQL fragments (ORDER BY columns, etc.) hardcoded as literals.
- **Tenant isolation**: The driving query WHERE clause MUST include `sh."tenantId" = ${tenantId}`. JOIN predicates to vacancy/client/user use FK-only (do not widen tenant scope via additional tenant filters on joined tables).
- **tenantId provenance**: Always sourced server-side from `getActiveTenantId()`, never from client input.

## Migration / Rollout

No migration required. Additive; revert feature branch to roll back.

## Open Questions

- [ ] Timezone is UTC by design; if tenants report boundary off-by-one in local time,
      a follow-up change introduces tenant-tz bounds. Accepted for v1.

## Exploration: Placements date-range report (recruitment area)

### Current State

The recruitment module tracks vacancies through a state machine. The terminal
status `PLACEMENT` operationally means **the client has already paid** (billing
milestone), not just a workflow state. A placement date is reliably recorded in
two places:

1. `Vacancy.placementConfirmedAt` (Prisma `schema.prisma:712`), set only by the
   `confirmPlacement` path (`ConfirmPlacementUseCase.ts:52`). The direct
   `FOLLOW_UP → PLACEMENT` transition does **not** set this column.
2. `vacancy_status_history` (`VacancyStatusHistory`, `schema.prisma:875-902`):
   every transition inserts a row with `newStatus`, `previousStatus`,
   `isRollback`, `changedById`, `tenantId`, and `createdAt @default(now())`.
   Rows where `newStatus = 'PLACEMENT'` are placement events. Indexed on
   `@@index([createdAt])` and `@@index([vacancyId, createdAt])`.

Confirmed business rules (from product owner — decided, not open):
- A placement is counted **once**: `COUNT(DISTINCT vacancyId)`, not event count.
- Rollback `PLACEMENT → HUNTING` is extremely rare; when it happens the case
  goes to "garantía" (warranty), it is **not** a re-count.

Existing infrastructure that makes this GREEN (no schema change needed):
- Route stub already exists: `reclutamiento/reportes/page.tsx` (currently a
  placeholder) — the natural home for this report.
- A dedicated permission already exists: `reportes-reclutamiento:acceder`
  (`PermissionActions.reportesReclutamiento.acceder`). **No new permission
  required.**
- `IVacancyStatusHistoryRepository` already exists with `create` +
  `findByVacancyId`; the Prisma impl uses tenant-scoped `findMany`. It only
  needs ONE new aggregation method.
- Established patterns for read-only action → use case → repo and TanStack
  query hooks are consistent across the feature (e.g. `getTernaHistory.action.ts`
  + `useTernaHistoryQuery.ts`).

### Affected Areas

- `openspec/changes/.../specs/recruitment/spec.md` — new delta requirement (spec phase).
- `src/app/(Dashboard)/(Reclutamiento)/reclutamiento/reportes/page.tsx` — replace
  stub with the report page (currently a "Kanban en construcción" placeholder).
- `src/features/vacancy/server/domain/interfaces/IVacancyStatusHistoryRepository.ts`
  — add a `countPlacementsInRange(...)` method (+ breakdown variant).
- `src/features/vacancy/server/infrastructure/repositories/PrismaVacancyStatusHistoryRepository.ts`
  — implement the aggregation with `COUNT(DISTINCT vacancyId)` scoped by `tenantId`.
- `src/features/vacancy/server/application/use-cases/` — new
  `GetPlacementsReportUseCase`.
- `src/features/vacancy/server/presentation/actions/` — new
  `getPlacementsReport.action.ts` (auth → tenant → permission → use case).
- `src/features/vacancy/frontend/hooks/` — new `usePlacementsReportQuery.ts`.
- `src/features/vacancy/frontend/pages/` + `components/` — date-range picker +
  count + optional breakdown column.
- `src/features/vacancy/frontend/types/vacancy.types.ts` — result DTO.

### Approaches

#### Data source (which TABLE to count)

1. **`vacancy_status_history` (RECOMMENDED)** — count distinct `vacancyId`
   where `newStatus = 'PLACEMENT'` and `createdAt` in range, scoped by `tenantId`.
   - Pros: covers BOTH transition paths (`confirmPlacement` AND the direct
     `FOLLOW_UP → PLACEMENT`); rollback-safe (rows are immutable events, and we
     COUNT DISTINCT so an extra re-entry after a warranty rollback still counts
     once); already indexed on `createdAt`; repo + tenant scoping already exist.
   - Cons: an `isRollback=true` row could theoretically carry `newStatus` other
     than PLACEMENT — filter strictly on `newStatus='PLACEMENT'`. A
     `HUNTING → ... → PLACEMENT` re-placement after warranty would be the SAME
     vacancy, so DISTINCT collapses it (matches "counted once").
   - Effort: Low.

2. **`Vacancy.placementConfirmedAt`** — count vacancies whose
   `placementConfirmedAt` falls in range.
   - Pros: single-table query, no join to history; arguably the "cleanest" column.
   - Cons: **misses the direct `FOLLOW_UP → PLACEMENT` path** which never sets
     this column → undercounts. Would require a data backfill or a code change to
     also set it on that path. Disqualifying for an accurate count today.
   - Effort: Low to query, Medium-High to make correct (backfill + code change).

**Recommendation: Approach 1 (status-history).** It is both the simplest correct
option and rollback-safe. Approach 2 is rejected because of the known
`FOLLOW_UP → PLACEMENT` gap.

#### Which date drives the range filter (OPEN — for propose phase)

This is a **product decision**, not a technical one. Surface both:

- **By confirmation date** (`vacancy_status_history.createdAt`): "placements that
  were CONFIRMED in this range." Always available for every placement event,
  directly indexed, no extra joins. Simplest and most accurate for an operational
  "how many did we close" report.
- **By billing date** (`Vacancy.commissionDate`, the 15th of next month, set in
  `confirmPlacement`): "placements that will/did BILL in this range." Matches the
  finance view, but `commissionDate` is only set on the `confirmPlacement` path
  (same gap as `placementConfirmedAt`), so a billing-based report needs the same
  caveat/backfill and requires joining `Vacancy`.

Tradeoff summary: confirmation-date is the GREEN, accurate default; billing-date
is a finance-aligned variant with a data-completeness caveat. **Do not decide
here — the product owner picks "by confirmation" vs "by billing" in propose.**

#### Optional breakdown ("en columna")

The user mentioned a breakdown column. Cheap to add to the same status-history
query via `GROUP BY`:
- **By recruiter** (`changedById` → user name): who closed placements. Most
  natural for a recruitment-area report.
- **By client**: requires a join from `vacancyId → Vacancy.clientId → client`.
  Slightly heavier; client filtering already shipped elsewhere so the join is known.

Recommend shipping recruiter breakdown as the optional column (lighter, no extra
joins beyond the existing `changedBy` relation already used in the repo), and
deferring client breakdown unless requested.

### Recommendation

Build a BASIC report at the existing `reclutamiento/reportes` route:
- Data source: `vacancy_status_history`, `COUNT(DISTINCT vacancyId)` where
  `newStatus='PLACEMENT'` AND `createdAt` in `[from, to]` AND `tenantId = active`.
- UI: a date-range picker + a headline count, plus an optional per-recruiter
  breakdown column.
- Gate with the existing `reportes-reclutamiento:acceder` permission (no new
  permission). Keep `reportes-reclutamiento:exportar` reserved for a later export
  feature.
- DDD layering (all small): 1 new repo method (+impl), 1 use case, 1 server
  action, 1 query hook, 1 page + 1 small component.

Defer the confirmation-vs-billing date decision to propose; default to
confirmation-date so the report is accurate today with zero schema/backfill work.

### Risks

- **Date semantics ambiguity** (confirmation vs billing) — must be resolved with
  the product owner in propose, or the report will answer the wrong question.
- **Timezone/boundary handling** — range filter on `createdAt` (a `DateTime`)
  must define inclusive/exclusive bounds and timezone; off-by-one-day at edges is
  the classic reporting bug. Decide UTC vs tenant-local in design.
- **`isRollback` rows** — strictly filter `newStatus='PLACEMENT'` so warranty
  rollbacks (`PLACEMENT → HUNTING`) are never counted as placements.
- **Permission seeding** — `reportes-reclutamiento:acceder` exists in constants;
  confirm it is actually seeded/assigned to recruitment roles, else the page is
  invisible to intended users.
- Low overall risk: GREEN feasibility, no migration, well-worn patterns.

### Effort / Size

Estimated well within the 400-line review budget:
- Repo interface + Prisma impl: ~40 lines
- Use case: ~40 lines
- Server action: ~40 lines
- Query hook: ~25 lines
- Types/DTO: ~15 lines
- Page + date-range component (basic, with optional breakdown table): ~150-200 lines

Total ~300-360 lines → fits one feature branch with a few work-unit commits, no
chained PRs. Verification = `bun run build` + `bun run lint` baseline parity
(no test framework).

### Ready for Proposal

**Yes** — with ONE decision the orchestrator must put to the user before/within
propose: **does the date range filter on confirmation date
(`vacancy_status_history.createdAt`) or billing date (`Vacancy.commissionDate`)?**
Recommended default: confirmation date (accurate today, no backfill). Everything
else (data source, counting semantics, route, permission) is decided and GREEN.

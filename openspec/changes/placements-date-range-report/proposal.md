# Proposal: Placements Date-Range Report

## Intent

Recruitment managers have no way to answer "how many placements happened in a given period" without manually counting. This report closes that gap with a date-range-filtered placements count, breakdowns (month/client/recruiter), and warranty distinction — all read-only, no schema change.

## Scope

### In Scope
- Summary card: gross total, net-business total (excluding warranty), warranty count
- Breakdowns: by month, by client, by recruiter
- Detailed placement list with warranty badge per row
- Date-range picker defaulting to current month (1st → today)
- Permission gate: `reportes-reclutamiento:acceder` (existing)
- Full DDD stack: repo method → use case → server action → query hook → page

### Out of Scope
- CSV/PDF export (deferred — `reportes-reclutamiento:exportar` reserved)
- Billing-date filter option (commissionDate has FOLLOW_UP→PLACEMENT gap)
- Filters beyond date range (e.g., by specific client or recruiter drill-down)
- Dashboard widgets or charts

## Capabilities

### New Capabilities
- `placements-date-range-report`: Date-range placements counting, warranty distinction, breakdowns, and detailed list

### Modified Capabilities
None

## Approach

- **Data source**: `vacancy_status_history` — `COUNT(DISTINCT vacancyId)` where `newStatus='PLACEMENT'` AND `createdAt` in range, scoped by `tenantId`. Covers both transition paths (PRE_PLACEMENT→PLACEMENT, FOLLOW_UP→PLACEMENT).
- **Warranty handling**: JOIN `Vacancy.isWarranty` to flag each placement. Compute two totals: gross (all) and net (excluding `isWarranty=true`).
- **Default range**: 1st of current month to today (ISO strings cross boundary).
- **Breakdowns**: GROUP BY month (`DATE_TRUNC`), client (`Vacancy.clientId`), recruiter (`changedById`).
- **Timezone**: Flag as design concern — decide UTC vs tenant-local in design phase.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/vacancy/server/domain/interfaces/IVacancyStatusHistoryRepository.ts` | Modified | Add `getPlacementsReport()` method |
| `src/features/vacancy/server/infrastructure/repositories/PrismaVacancyStatusHistoryRepository.ts` | Modified | Implement aggregation query with JOIN to Vacancy |
| `src/features/vacancy/server/application/use-cases/` | New | `GetPlacementsReportUseCase` |
| `src/features/vacancy/server/presentation/actions/` | New | `getPlacementsReport.action.ts` |
| `src/features/vacancy/frontend/hooks/` | New | `usePlacementsReportQuery.ts` |
| `src/features/vacancy/frontend/types/vacancy.types.ts` | Modified | Add report DTO types |
| `src/features/vacancy/frontend/pages/` + `components/` | New | Report page + date-range picker + breakdown tables |
| `src/app/(Dashboard)/(Reclutamiento)/reclutamiento/reportes/page.tsx` | Modified | Replace stub with report page |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timezone edge: off-by-one day at range boundaries | Med | Design phase decides UTC vs tenant-local; use start-of-day/end-of-day bounds |
| Permission not seeded for recruitment roles | Low | Verify seed data; constant exists at `PermissionActions.reportesReclutamiento.acceder` |
| Large history tables slow aggregation | Low | Existing indexes on `(vacancyId, createdAt)` and `(createdAt)`; DISTINCT collapses rows |

## Rollback Plan

Revert the feature branch. All changes are additive (new files + one repo method + one route replacement). No schema migration to roll back. The reportes stub returns to its placeholder state.

## Dependencies

- None. All infrastructure (table, indexes, permission constant, route stub) already exists.

## Success Criteria

- [ ] Report page loads at `reclutamiento/reportes` gated by `reportes-reclutamiento:acceder`
- [ ] Date-range filter returns correct placement count matching manual DB query
- [ ] Warranty placements flagged separately; net total excludes them
- [ ] Breakdowns by month, client, and recruiter render correctly
- [ ] `bun run build` and `bun run lint` pass with no regressions
- [ ] Estimated ~300-360 lines, within 400-line budget

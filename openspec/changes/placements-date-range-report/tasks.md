# Tasks: Placements Date-Range Report

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 380-590 lines |
| 400-line budget risk | Medium to High |
| Chained PRs recommended | No (solo dev, single feature branch) |
| Suggested split | 3 work-unit commits on feature branch |
| Delivery strategy | Dedicated feature branch + well-structured commits, merged to main at end |
| Commit strategy | Bottom-up commits (domain→application→frontend), each builds green |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Medium

### Suggested Work Units (Commits)

| Unit | Goal | Files | Verification |
|------|------|-------|--------------|
| 1 | Domain + Infrastructure: Placement query foundation | IVacancyStatusHistoryRepository + PrismaVacancyStatusHistoryRepository | `bun run build` + `bun run lint` pass |
| 2 | Application + Presentation: Business logic + server action | GetPlacementsReportUseCase + action + DTO types | Build + lint pass |
| 3 | Frontend: UI components + route wiring | Hook + page + components + route render + PermissionGuard | Build + lint + manual report count check vs DB |

Each commit is self-contained, builds green, and represents a logical layer of the feature. Rollback = revert feature branch.

---

## Phase 1: Domain + Infrastructure (Commit 1)

**Foundation**: Repository interface + Prisma implementation with $queryRaw

- [x] 1.1 **Add `getPlacementsReport` method to `IVacancyStatusHistoryRepository.ts`**
  - Export `PlacementRow` type: `{ vacancyId: string; position: string; clientId: string; clientName: string; recruiterId: string; recruiterName: string; isWarranty: boolean; placedAt: Date }`
  - Add method signature: `getPlacementsReport(params: { tenantId: string; from: Date; toExclusive: Date }): Promise<PlacementRow[]>`
  - `recruiterName` is non-null (FK `Vacancy.recruiterId` non-null, onDelete: Restrict)

- [x] 1.2 **Implement `getPlacementsReport` in `PrismaVacancyStatusHistoryRepository.ts`**
  - Use `prisma.$queryRaw` with `Prisma.sql` tagged template (NEVER `$queryRawUnsafe`, NEVER string concatenation)
  - **CRITICAL**: Double-quote ALL camelCase columns: `sh."vacancyId"`, `sh."tenantId"`, `sh."createdAt"`, `sh."newStatus"`, `v."recruiterId"`, `v."isWarranty"`, `v."clientId"`, `c."nombre"`, `u."name"`
  - Query structure:
    ```sql
    SELECT DISTINCT ON (sh."vacancyId")
      sh."vacancyId", v.position, v."clientId", c.nombre as "clientName",
      v."recruiterId", u.name as "recruiterName", v."isWarranty", sh."createdAt" as "placedAt"
    FROM vacancy_status_history sh
    JOIN vacancy v ON sh."vacancyId" = v.id
    JOIN client c ON v."clientId" = c.id
    JOIN user u ON v."recruiterId" = u.id
    WHERE sh."tenantId" = ${tenantId}
      AND sh."newStatus" = 'PLACEMENT'
      AND sh."createdAt" >= ${from}
      AND sh."createdAt" < ${toExclusive}
    ORDER BY sh."vacancyId", sh."createdAt" DESC
    ```
  - Tenant isolation: `sh."tenantId" = ${tenantId}` in WHERE (sourced from `getActiveTenantId()` server-side, NEVER from client)
  - Half-open interval: `>= from` AND `< toExclusive`
  - DISTINCT ON + ORDER BY createdAt DESC = keeps LATEST in-range PLACEMENT per vacancy
  - JOIN to `vacancy.recruiterId` (assigned recruiter), NOT `changedById`
  - Return typed as `PlacementRow[]`

- [x] 1.3 **Verification**
  - `bun run build` passes
  - `bun run lint` passes
  - Manual: Query compiles without Prisma errors

---

## Phase 2: Application + Presentation (Commit 2)

**Business Logic**: Use case + server action + DTO types

- [ ] 2.1 **Create `GetPlacementsReportUseCase.ts`** in `src/features/reclutamiento/server/application/use-cases/`
  - Constructor: `(private readonly repo: IVacancyStatusHistoryRepository)`
  - Method: `async execute(input: { tenantId: string; from: string /*ISO*/; to: string /*ISO*/ }): Promise<{ success: boolean; data?: PlacementsReportDTO; error?: string }>`
  - **Range validation**: Parse ISO strings; reject `from > to` with `{ success: false, error: "Rango inválido" }`; single-day (`from == to`) works via `toExclusive = startOfDay(from) + 1 day`
  - **UTC bounds**: `from` = start-of-day UTC (`new Date(input.from + 'T00:00:00.000Z')`); `toExclusive` = start-of-day-after-`to` UTC (`new Date(input.to + 'T00:00:00.000Z') + 1 day`)
  - Call `repo.getPlacementsReport({ tenantId, from, toExclusive })`
  - **Totals**: `gross = placements.length`, `warranty = placements.filter(p => p.isWarranty).length`, `net = gross - warranty`
  - **Breakdowns** (all in TypeScript, NOT SQL):
    - `byMonth`: Group by `placedAt.toISOString().slice(0, 7)` (YYYY-MM UTC); **FORBIDDEN**: `Date.prototype.getMonth()/getFullYear()` (local-time methods)
    - `byClient`: Group by `clientId` (label = `clientName`)
    - `byRecruiter`: Group by `recruiterId` (label = `recruiterName`)
    - Each breakdown row: `{ key, label, gross, net, warranty }` where `gross = net + warranty` (partition the same distinct placement list)
  - **Invariant check**: Assert `sum(byMonth.gross) == summary.gross` (and same for byClient, byRecruiter); log warning if mismatch (bucketing bug)
  - **List**: Map placements to `PlacementListRow[]` (dates as ISO strings)
  - Return `{ success: true, data: { filters: { from: input.from, to: input.to }, summary, byMonth, byClient, byRecruiter, list } }`

- [ ] 2.2 **Create `getPlacementsReport.action.ts`** in `src/features/reclutamiento/server/presentation/actions/`
  - `"use server"` directive
  - Input: `{ from: string; to: string }` (ISO dates, inclusive days)
  - Auth: `const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return { error: "No autenticado" };`
  - Tenant: `const tenantId = await getActiveTenantId(); if (!tenantId) return { error: "No hay tenant activo" };`
  - Permission: `CheckAnyPermissonUseCase` → `PermissionActions.reportesReclutamiento.acceder`; if false: `{ error: "Sin permisos" }`
  - Execute: `new GetPlacementsReportUseCase(prismaVacancyStatusHistoryRepository).execute({ tenantId, from, to })`
  - Return: `{ error: null, data: result.data }` or `{ error: result.error ?? "Error inesperado" }`
  - No `revalidatePath` (read-only report)

- [ ] 2.3 **Add report DTO types to `vacancy.types.ts`** in `src/features/reclutamiento/frontend/types/`
  - `interface PlacementsReportFilters { from: string; to: string }` (inclusive day, UTC)
  - `interface BreakdownRow { key: string; label: string; gross: number; net: number; warranty: number }`
  - `interface PlacementListRow { vacancyId: string; position: string; clientName: string; recruiterName: string; isWarranty: boolean; placedAt: string /*ISO*/ }`
  - `interface PlacementsReportDTO { filters: PlacementsReportFilters; summary: { gross: number; net: number; warranty: number }; byMonth: BreakdownRow[]; byClient: BreakdownRow[]; byRecruiter: BreakdownRow[]; list: PlacementListRow[] }`

- [ ] 2.4 **Verification**
  - `bun run build` passes
  - `bun run lint` passes
  - Manual: Action compiles; use case logic type-checks

---

## Phase 3: Frontend UI (Commit 3)

**User Interface**: Query hook + page + components + route wiring

- [ ] 3.1 **Create `usePlacementsReportQuery.ts`** in `src/features/reclutamiento/frontend/hooks/`
  - `"use client"` directive
  - `useQuery` with key `["placements-report", tenant?.id, from, to]`
  - `queryFn`: Call `getPlacementsReportAction({ from, to })`; throw on `result.error`; return `result.data`
  - `enabled: !!tenant?.id && !!from && !!to`
  - `placeholderData: keepPreviousData` (smooth transitions on date change)
  - `staleTime: 30_000` (30s)
  - Error toast: `showToast({ type: "error", title: "Error al cargar reporte", description: error.message })`

- [ ] 3.2 **Create `PlacementsReportPage.tsx`** in `src/features/reclutamiento/frontend/pages/`
  - State: `const [from, setFrom] = useState<string>(startOfMonth ISO)`, `const [to, setTo] = useState<string>(today ISO)`
  - Default range: current month from day 1 through today (UTC ISO strings)
  - Query: `const { data, isLoading } = usePlacementsReportQuery({ from, to })`
  - Layout: Two `DatePicker`s (Desde/Hasta) with min/max linkage (Desde.max = to, Hasta.min = from), Summary card, 3 breakdown tables, detailed list

- [ ] 3.3 **Create summary card component** (`PlacementsReportSummary.tsx`)
  - Display `summary.gross`, `summary.net`, `summary.warranty` in card layout
  - Labels: "Total Colocaciones", "Neto Negocio", "Garantías"
  - Show warranty count badge if > 0

- [ ] 3.4 **Create breakdown table components** (`PlacementsBreakdownTable.tsx`)
  - Reusable component accepting `{ title: string; rows: BreakdownRow[] }`
  - Columns: Dimension (label), Gross, Net, Warranty
  - Use `@shadcn/*` DataTable or simple `<table>` with shadcn styling
  - Three instances: "Por Mes" (byMonth), "Por Cliente" (byClient), "Por Reclutador" (byRecruiter)

- [ ] 3.5 **Create detailed list component** (`PlacementsDetailedList.tsx`)
  - Columns: Vacante/Posición, Cliente, Reclutador, Fecha Colocación, Garantía (badge)
  - Use `@shadcn/*` DataTable or simple table
  - Warranty badge: visual flag for `isWarranty = true`
  - Format `placedAt` ISO string as readable date (using `date-fns`)

- [ ] 3.6 **Render `PlacementsReportPage` at `reclutamiento/reportes/page.tsx`**
  - Wrap with `<PermissionGuard permissions={[PermissionActions.reportesReclutamiento.acceder]}>`
  - Import and render `<PlacementsReportPage />`

- [ ] 3.7 **Verification**
  - `bun run build` passes
  - `bun run lint` passes
  - **Manual count check** (Success Criteria):
    1. Open report for a known date range
    2. Run direct DB query: `SELECT COUNT(DISTINCT sh."vacancyId") FROM vacancy_status_history sh WHERE sh."tenantId" = '...' AND sh."newStatus" = 'PLACEMENT' AND sh."createdAt" >= '...' AND sh."createdAt" < '...'`
    3. Compare DB count vs `summary.gross` in UI — MUST match
    4. Verify warranty subset: Count `isWarranty = true` in DB vs `summary.warranty` — MUST match
    5. Check invariant: `summary.gross = summary.net + summary.warranty` — MUST hold
    6. Check breakdown sums: `sum(byMonth.gross) == summary.gross`, `sum(byClient.gross) == summary.gross`, `sum(byRecruiter.gross) == summary.gross` — MUST all equal
  - Manual boundary check: Single-day range (from == to) returns that day's placements
  - Manual edge case: Inverted range (from > to) shows validation error toast

---

## Implementation Guardrails

**$queryRaw safety**:
- Use `Prisma.sql` tagged template ONLY — NEVER `$queryRawUnsafe`, NEVER string concatenation
- Double-quote ALL camelCase columns (e.g. `sh."vacancyId"`, `v."isWarranty"`)
- Static SQL fragments (ORDER BY, column names) hardcoded as literals

**Tenant isolation**:
- `tenantId` in WHERE clause from `getActiveTenantId()` (server-side, NEVER from client input)
- JOIN predicates use FK-only (do not widen tenant scope via additional tenant filters on joined tables)

**Recruiter dimension**:
- Recruiter = `Vacancy.recruiterId` (assigned), NOT `changedById`
- JOIN `vacancy."recruiterId" = user.id` always resolves (FK non-null, onDelete: Restrict)

**Canonical placement**:
- LATEST in-range PLACEMENT transition per vacancy (DISTINCT ON + ORDER BY createdAt DESC)
- By-month attribution uses this `placedAt` date

**Timezone**:
- UTC half-open interval `[from 00:00Z, toExclusive 00:00Z)`
- By-month bucket via UTC extraction (`toISOString().slice(0,7)`) — FORBIDDEN: `getMonth()/getFullYear()` (local-time methods)

**Range validation**:
- Reject `from > to` with validation error (NEVER silently return zero)
- Single-day (`from == to`) works via `toExclusive = from + 1 day`

**Warranty semantics**:
- `Vacancy.isWarranty = true` flagged + excluded from net
- Per-row invariant: `gross = net + warranty`
- Summary invariant: `gross = net + warranty`

**Dates cross boundary as ISO strings**:
- Server → Client: `Date` → `toISOString()`
- Client → Server: ISO string → `new Date(iso)`

**Rollback**:
- Additive feature; revert feature branch to roll back
- No schema changes; no migration

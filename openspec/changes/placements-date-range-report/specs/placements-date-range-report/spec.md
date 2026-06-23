# Placements Date-Range Report Specification

## Purpose

Provide a read-only recruitment report that answers how many placements were confirmed in a selected date range, with warranty separation, breakdowns, and a detailed list.

## Requirements

### Requirement: Date-range placement reporting

The system MUST filter placements by confirmation date using `vacancy_status_history.createdAt` where `newStatus = 'PLACEMENT'`.
The system MUST default the range to the current month from the first day through today when no dates are provided.

#### Scenario: Default current-month range

- GIVEN a user opens the report without selecting dates
- WHEN the report loads
- THEN the system MUST use the current month from day 1 through today
- AND show only placements confirmed in that range

#### Scenario: Empty range returns no placements

- GIVEN no placements were confirmed in the selected range
- WHEN the report loads
- THEN the summary totals MUST be zero
- AND the detailed list MUST be empty

#### Scenario: Inverted range returns validation error

- GIVEN a user selects `from` after `to` (inverted range)
- WHEN the report is requested
- THEN the system MUST return a validation error
- AND MUST NOT silently return zero results

#### Scenario: Single-day range returns that day's placements

- GIVEN a user selects the same date for `from` and `to`
- WHEN the report is requested
- THEN the system MUST return placements confirmed on that single day (half-open `[from 00:00Z, from+1day 00:00Z)`)

### Requirement: Placement counts and warranty totals

The system MUST compute gross total as `COUNT(DISTINCT vacancyId)`.
When a vacancy has multiple in-range PLACEMENT transitions, the system MUST use the LATEST (most recent) one as the canonical placement date (`placedAt`); by-month attribution uses this date.
The system MUST compute net business total by excluding placements where `Vacancy.isWarranty = true`.
The system MUST compute warranty count from placements marked as warranty.
The invariant `net = gross − warranty` MUST hold for both the summary and each breakdown row.

#### Scenario: Warranty placements affect totals correctly

- GIVEN a range contains warranty and non-warranty placements
- WHEN the report is generated
- THEN gross total MUST count all distinct vacancies once
- AND net business total MUST exclude warranty vacancies
- AND warranty count MUST reflect the warranty vacancies

#### Scenario: Rolled-back placement still counts once (latest transition wins)

- GIVEN a vacancy was confirmed as PLACEMENT, rolled back to HUNTING, and confirmed as PLACEMENT again within the range
- WHEN the report is generated for the original confirmation range
- THEN that vacancy MUST count once in gross total using the latest in-range PLACEMENT transition as the canonical placement date
- AND it MUST be flagged as warranty in the detailed list if `Vacancy.isWarranty = true`
- AND warranty vacancies MUST be excluded from net business total

### Requirement: Report breakdowns

The system MUST provide breakdowns by month, client, and recruiter (the assigned recruiter on the vacancy, `Vacancy.recruiterId`).
Each breakdown row MUST use the same distinct placement semantics and expose gross, net, and warranty counts.
For each breakdown row: `gross = net + warranty`. The sum of `gross` across all rows in any breakdown MUST equal `summary.gross`.

#### Scenario: Breakdowns reflect the same placement set

- GIVEN a range with placements across multiple months, clients, and recruiters
- WHEN the report loads
- THEN the month, client, and recruiter breakdowns MUST match the same filtered placement set
- AND each breakdown MUST use distinct vacancy counting

### Requirement: Detailed placement list

The system MUST show a detailed list containing vacancy/position, client, recruiter, confirmation date, and warranty flag for each placement.

#### Scenario: Detailed rows include required fields

- GIVEN placements exist in the selected range
- WHEN the report loads
- THEN each row MUST show vacancy or position, client, recruiter, confirmation date, and warranty flag
- AND warranty rows MUST be visibly flagged

### Requirement: Access control and tenant isolation

The system MUST allow access only to users with `reportes-reclutamiento:acceder`.
The system MUST scope all report data by `tenantId`.

#### Scenario: Unauthorized users cannot access the report

- GIVEN a user lacks `reportes-reclutamiento:acceder`
- WHEN the user requests the report
- THEN access MUST be denied

#### Scenario: Other tenants are excluded

- GIVEN multiple tenants have placements in the same date range
- WHEN the report loads for one tenant
- THEN only that tenant's placements MUST be included

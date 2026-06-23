import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import type {
  BreakdownRow,
  PlacementListRow,
  PlacementsReportDTO,
} from "@features/vacancy/frontend/types/vacancy.types";

export interface GetPlacementsReportInput {
  tenantId: string;
  from: string;
  to: string;
}

export interface GetPlacementsReportOutput {
  success: boolean;
  data?: PlacementsReportDTO;
  error?: string;
}

export class GetPlacementsReportUseCase {
  constructor(
    private readonly repo: IVacancyStatusHistoryRepository
  ) {}

  async execute(
    input: GetPlacementsReportInput
  ): Promise<GetPlacementsReportOutput> {
    try {
      // Compute UTC half-open interval [from 00:00Z, toExclusive 00:00Z)
      const fromDate = new Date(input.from + "T00:00:00.000Z");
      const toDate = new Date(input.to + "T00:00:00.000Z");

      // Reject inverted ranges — never silently return zero
      if (fromDate > toDate) {
        return { success: false, error: "Rango inválido" };
      }

      // toExclusive = start of the day after `to` (single-day: from==to works)
      const toExclusive = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);

      const placements = await this.repo.getPlacementsReport({
        tenantId: input.tenantId,
        from: fromDate,
        toExclusive,
      });

      // Summary totals
      const gross = placements.length;
      const warranty = placements.filter((p) => p.isWarranty).length;
      const net = gross - warranty;

      // Breakdown helpers — group the same distinct placement list
      const byMonthMap = new Map<string, { gross: number; warranty: number; label: string }>();
      const byClientMap = new Map<string, { gross: number; warranty: number; label: string }>();
      const byRecruiterMap = new Map<string, { gross: number; warranty: number; label: string }>();

      for (const p of placements) {
        // By month — UTC bucket via toISOString (FORBIDDEN: getMonth/getFullYear)
        const monthKey = p.placedAt.toISOString().slice(0, 7);
        const monthEntry = byMonthMap.get(monthKey) ?? {
          gross: 0,
          warranty: 0,
          label: monthKey,
        };
        monthEntry.gross++;
        if (p.isWarranty) monthEntry.warranty++;
        byMonthMap.set(monthKey, monthEntry);

        // By client
        const clientEntry = byClientMap.get(p.clientId) ?? {
          gross: 0,
          warranty: 0,
          label: p.clientName,
        };
        clientEntry.gross++;
        if (p.isWarranty) clientEntry.warranty++;
        byClientMap.set(p.clientId, clientEntry);

        // By recruiter
        const recruiterEntry = byRecruiterMap.get(p.recruiterId) ?? {
          gross: 0,
          warranty: 0,
          label: p.recruiterName,
        };
        recruiterEntry.gross++;
        if (p.isWarranty) recruiterEntry.warranty++;
        byRecruiterMap.set(p.recruiterId, recruiterEntry);
      }

      const toBreakdownRows = (
        map: Map<string, { gross: number; warranty: number; label: string }>
      ): BreakdownRow[] =>
        [...map.entries()].map(([key, { gross, warranty, label }]) => ({
          key,
          label,
          gross,
          warranty,
          net: gross - warranty,
        }));

      const byMonth = toBreakdownRows(byMonthMap);
      const byClient = toBreakdownRows(byClientMap);
      const byRecruiter = toBreakdownRows(byRecruiterMap);

      // Invariant check — log warning if bucketing is inconsistent
      const monthGrossSum = byMonth.reduce((sum, r) => sum + r.gross, 0);
      const clientGrossSum = byClient.reduce((sum, r) => sum + r.gross, 0);
      const recruiterGrossSum = byRecruiter.reduce((sum, r) => sum + r.gross, 0);

      if (monthGrossSum !== gross || clientGrossSum !== gross || recruiterGrossSum !== gross) {
        console.warn(
          "[GetPlacementsReportUseCase] Invariant mismatch: breakdown gross sums do not equal summary.gross",
          { gross, monthGrossSum, clientGrossSum, recruiterGrossSum }
        );
      }

      // Detailed list — dates as ISO strings
      const list: PlacementListRow[] = placements.map((p) => ({
        vacancyId: p.vacancyId,
        position: p.position,
        clientName: p.clientName,
        recruiterName: p.recruiterName,
        isWarranty: p.isWarranty,
        placedAt: p.placedAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          filters: { from: input.from, to: input.to },
          summary: { gross, net, warranty },
          byMonth,
          byClient,
          byRecruiter,
          list,
        },
      };
    } catch (error) {
      console.error("Error in GetPlacementsReportUseCase:", error);
      return { success: false, error: "Error al generar el reporte" };
    }
  }
}

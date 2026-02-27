import type { IVacancyTernaHistoryRepository } from "../../domain/interfaces/IVacancyTernaHistoryRepository";

export interface GetTernaHistoryInput {
  vacancyId: string;
  tenantId: string;
}

export interface TernaHistoryCandidateDTO {
  id: string;
  candidateId: string;
  candidateFullName: string;
}

export interface TernaHistoryDTO {
  id: string;
  vacancyId: string;
  ternaNumber: number;
  validatedAt: string;
  validatedById: string;
  validatedByName: string | null;
  targetDeliveryDate: string | null;
  isOnTime: boolean;
  tenantId: string;
  candidates: TernaHistoryCandidateDTO[];
}

export interface GetTernaHistoryOutput {
  success: boolean;
  histories?: TernaHistoryDTO[];
  error?: string;
}

export class GetTernaHistoryUseCase {
  constructor(
    private readonly ternaHistoryRepo: IVacancyTernaHistoryRepository
  ) {}

  async execute(input: GetTernaHistoryInput): Promise<GetTernaHistoryOutput> {
    try {
      const histories = await this.ternaHistoryRepo.findByVacancyId(
        input.vacancyId,
        input.tenantId
      );

      return {
        success: true,
        histories: histories.map((h) => ({
          id: h.id,
          vacancyId: h.vacancyId,
          ternaNumber: h.ternaNumber,
          validatedAt: h.validatedAt.toISOString(),
          validatedById: h.validatedById,
          validatedByName: h.validatedByName ?? null,
          targetDeliveryDate: h.targetDeliveryDate?.toISOString() ?? null,
          isOnTime: h.isOnTime,
          tenantId: h.tenantId,
          candidates: h.candidates.map((c) => ({
            id: c.id,
            candidateId: c.candidateId,
            candidateFullName: c.candidateFullName,
          })),
        })),
      };
    } catch (error) {
      console.error("Error in GetTernaHistoryUseCase:", error);
      return { success: false, error: "Error al obtener el historial de ternas" };
    }
  }
}

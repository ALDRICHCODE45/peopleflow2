import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyCandidateRepository } from "../../domain/interfaces/IVacancyCandidateRepository";
import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import type { IVacancyTernaHistoryRepository } from "../../domain/interfaces/IVacancyTernaHistoryRepository";
import { VacancyWorkflowService } from "../../domain/services/VacancyWorkflowService";
import { InngestEvents } from "@core/shared/constants/inngest-events";

export interface ValidateTernaInput {
  vacancyId: string;
  tenantId: string;
  /** IDs de candidatos seleccionados para la terna */
  candidateIds: string[];
  changedById: string;
  /** ISO date string (YYYY-MM-DD) — if omitted, defaults to now */
  validatedAt?: string;
}

export interface ValidateTernaOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
  inngestEvent?: {
    name: string;
    data: Record<string, unknown>;
  };
}

export class ValidateTernaUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly candidateRepo: IVacancyCandidateRepository,
    private readonly statusHistoryRepo: IVacancyStatusHistoryRepository,
    private readonly ternaHistoryRepo: IVacancyTernaHistoryRepository
  ) {}

  async execute(input: ValidateTernaInput): Promise<ValidateTernaOutput> {
    try {
      const { vacancyId, tenantId, candidateIds, changedById, validatedAt: validatedAtISO } = input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Validate status
      if (vacancy.status !== "HUNTING") {
        return {
          success: false,
          error:
            "La vacante debe estar en estado Hunting para validar la terna",
        };
      }

      // 3. Validate terna selection
      const ternaResult = VacancyWorkflowService.validateTerna(candidateIds);
      if (!ternaResult.valid) {
        return { success: false, error: ternaResult.error };
      }

      // 4. Load candidate details for the history snapshot
      const allCandidates = await this.candidateRepo.findByVacancyId(vacancyId, tenantId);
      const ternaCandidates = allCandidates.filter((c) =>
        candidateIds.includes(c.id)
      );

      // 5. Count existing terna histories to determine terna number
      const existingCount = await this.ternaHistoryRepo.countByVacancyId(vacancyId, tenantId);
      const ternaNumber = existingCount + 1;

      // 6. Calculate isOnTime — use user-provided date when available
      const targetDeliveryDate = vacancy.targetDeliveryDate ?? null;
      const effectiveDate = validatedAtISO
        ? new Date(`${validatedAtISO}T12:00:00`)
        : new Date();
      const isOnTime = targetDeliveryDate ? effectiveDate <= targetDeliveryDate : true;

      // 7. Clear previous terna (sequential — must complete before marking new ones)
      await this.candidateRepo.clearTerna(vacancyId, tenantId);

      // 8. Execute in parallel: mark terna, discard others, update vacancy, create histories
      const [, , updatedVacancy] = await Promise.all([
        this.candidateRepo.markAsInTerna(candidateIds, vacancyId, tenantId),
        this.candidateRepo.markNonTernaAsDescartado(vacancyId, tenantId, candidateIds),
        this.vacancyRepo.update(vacancyId, tenantId, {
          status: "FOLLOW_UP",
          actualDeliveryDate: effectiveDate,
        }),
        this.statusHistoryRepo.create({
          vacancyId,
          previousStatus: "HUNTING",
          newStatus: "FOLLOW_UP",
          isRollback: false,
          changedById,
          tenantId,
        }),
        this.ternaHistoryRepo.create({
          vacancyId,
          ternaNumber,
          validatedById: changedById,
          ...(validatedAtISO ? { validatedAt: effectiveDate } : {}),
          targetDeliveryDate,
          isOnTime,
          tenantId,
          candidates: ternaCandidates.map((c) => ({
            candidateId: c.id,
            candidateFullName: `${c.firstName} ${c.lastName}`,
          })),
        }),
      ]);

      if (!updatedVacancy) {
        return { success: false, error: "Error al actualizar la vacante" };
      }

      // Build Inngest event for FOLLOW_UP email notification
      const inngestEvent = {
        name: InngestEvents.email.send,
        data: {
          template: "vacancy-status-follow-up" as const,
          tenantId,
          triggeredById: changedById,
          data: {
            recruiterName: vacancy.recruiterName ?? "Reclutador",
            recruiterEmail: vacancy.recruiterEmail ?? "",
            vacancyPosition: vacancy.position,
            clientName: vacancy.clientName ?? "Cliente",
            vacancyId,
          },
        },
      };

      return { success: true, vacancy: updatedVacancy.toJSON(), inngestEvent };
    } catch (error) {
      console.error("Error in ValidateTernaUseCase:", error);
      return { success: false, error: "Error al validar la terna" };
    }
  }
}

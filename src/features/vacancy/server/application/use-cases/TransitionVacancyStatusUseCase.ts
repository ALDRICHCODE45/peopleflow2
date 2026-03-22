import type {
  VacancyStatusType,
  VacancyDTO,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import {
  evaluateTransition,
  isRollbackTransition,
  type VacancyTransitionContext,
} from "../../domain/services/VacancyStateMachine";
import { InngestEvents } from "@core/shared/constants/inngest-events";

export interface TransitionVacancyStatusInput {
  vacancyId: string;
  tenantId: string;
  newStatus: VacancyStatusType;
  changedById: string;
  /** For rollbacks (→ HUNTING from FOLLOW_UP / PRE_PLACEMENT) and secondary states */
  reason?: string | null;
  newTargetDeliveryDate?: Date | null;
  /** Attachment data provided by the server action (queried before calling the use case) */
  hasJobDescription?: boolean;
  hasValidatedPerfilMuestra?: boolean;
  /** For PRE_PLACEMENT and PLACEMENT transitions */
  salaryFixed?: number | null;
  entryDate?: Date | null;
  sendCongratsEmail?: boolean;
}

export interface TransitionVacancyStatusOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
  inngestEvent?: {
    name: string;
    data: Record<string, unknown>;
  };
}

export class TransitionVacancyStatusUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly statusHistoryRepo: IVacancyStatusHistoryRepository
  ) {}

  async execute(
    input: TransitionVacancyStatusInput
  ): Promise<TransitionVacancyStatusOutput> {
    try {
      const {
        vacancyId,
        tenantId,
        newStatus,
        changedById,
        reason,
        newTargetDeliveryDate,
        hasJobDescription = false,
        hasValidatedPerfilMuestra = false,
        salaryFixed,
        entryDate,
        sendCongratsEmail,
      } = input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      const currentStatus = vacancy.status;
      const isRollback = isRollbackTransition(currentStatus, newStatus);

      // Auto-populate salaryFixed from vacancy when salaryType is FIXED
      let effectiveSalaryFixed = salaryFixed;
      if (vacancy.salaryType === "FIXED" && vacancy.salaryFixed != null && vacancy.salaryFixed > 0) {
        effectiveSalaryFixed = effectiveSalaryFixed ?? vacancy.salaryFixed;
      }

      // 2. Build context for the state machine
      const candidates = vacancy.toJSON().candidates ?? [];
      const inTernaCount = candidates.filter((c) => c.isInTerna).length;
      const finalistCount = candidates.filter((c) => c.isFinalist).length;

      const ctx: VacancyTransitionContext = {
        vacancy: {
          id: vacancy.id,
          status: currentStatus,
          salaryType: vacancy.salaryType,
          salaryFixed: vacancy.salaryFixed,
          entryDate: vacancy.entryDate?.toISOString() ?? null,
          checklistValidatedAt:
            vacancy.checklistValidatedAt?.toISOString() ?? null,
          rollbackCount: vacancy.rollbackCount,
        },
        attachments: {
          hasJobDescription,
          hasValidatedPerfilMuestra,
        },
        candidates: {
          inTernaCount,
          finalistCount,
        },
        input: {
          reason,
          newTargetDeliveryDate: newTargetDeliveryDate?.toISOString() ?? null,
          salaryFixed: effectiveSalaryFixed ?? null,
          entryDate: entryDate?.toISOString() ?? null,
        },
      };

      // 3. Evaluate transition via state machine
      const evaluation = evaluateTransition(currentStatus, newStatus, ctx);
      if (!evaluation.valid) {
        if (evaluation.failedGuard) {
          console.warn(
            `[TransitionVacancyStatus] Guard failed: ${evaluation.failedGuard} for ${currentStatus} → ${newStatus}`
          );
        }
        return { success: false, error: evaluation.reason };
      }

      // 4. Build update payload
      let updateData: Record<string, unknown>;
      let historyData: {
        isRollback: boolean;
        reason?: string | null;
        newTargetDeliveryDate?: Date | null;
      };

      const isPlacementTransition =
        newStatus === "PLACEMENT" &&
        (currentStatus === "PRE_PLACEMENT" || currentStatus === "FOLLOW_UP");

      const needsSalaryAndDate =
        newStatus === "PRE_PLACEMENT" || isPlacementTransition;

      if (isRollback) {
        updateData = {
          status: newStatus,
          rollbackCount: vacancy.rollbackCount + 1,
          targetDeliveryDate: newTargetDeliveryDate,
          actualDeliveryDate: null,
        };
        historyData = { isRollback: true, reason, newTargetDeliveryDate };
      } else if (isPlacementTransition) {
        // Any transition → PLACEMENT: update salary/date + set placementConfirmedAt & commissionDate
        const today = new Date();
        const commissionDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
        updateData = {
          status: newStatus,
          salaryFixed: effectiveSalaryFixed ?? vacancy.salaryFixed,
          entryDate: entryDate ?? vacancy.entryDate,
          placementConfirmedAt: new Date(),
          commissionDate,
          congratsEmailSent: sendCongratsEmail ?? false,
        };
        historyData = { isRollback: false, reason: reason ?? null };
      } else if (needsSalaryAndDate) {
        updateData = {
          status: newStatus,
          salaryFixed: effectiveSalaryFixed ?? null,
          entryDate: entryDate ?? null,
        };
        historyData = { isRollback: false, reason: reason ?? null };
      } else {
        updateData = { status: newStatus };
        historyData = { isRollback: false, reason: reason ?? null };
      }

      // 5. Execute update + history creation in parallel
      const [updatedVacancy] = await Promise.all([
        this.vacancyRepo.update(vacancyId, tenantId, updateData),
        this.statusHistoryRepo.create({
          vacancyId,
          previousStatus: currentStatus,
          newStatus,
          changedById,
          tenantId,
          ...historyData,
        }),
      ]);

      if (!updatedVacancy) {
        return { success: false, error: "Error al actualizar la vacante" };
      }

      // 6. Determine Inngest event to fire
      let inngestEvent: TransitionVacancyStatusOutput["inngestEvent"];

      if (newStatus === "HUNTING" && currentStatus === "QUICK_MEETING") {
        inngestEvent = {
          name: InngestEvents.email.send,
          data: {
            template: "vacancy-status-hunting" as const,
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
      } else if (newStatus === "PRE_PLACEMENT") {
        inngestEvent = {
          name: InngestEvents.vacancy.prePlacementEntered,
          data: {
            vacancyId,
            tenantId,
            recruiterId: vacancy.recruiterId,
            vacancyPosition: vacancy.position,
            entryDate: entryDate?.toISOString() ?? "",
          },
        };
      } else if (newStatus === "PLACEMENT" && sendCongratsEmail) {
        // Find finalist candidate for congrats email
        const finalistCandidate = candidates.find(
          (c) => c.isFinalist || c.isInTerna
        );
        inngestEvent = {
          name: InngestEvents.vacancy.placementCongratsEmail,
          data: {
            vacancyId,
            tenantId,
            vacancyPosition: vacancy.position,
            candidateName: finalistCandidate
              ? `${finalistCandidate.firstName ?? ""} ${finalistCandidate.lastName ?? ""}`.trim()
              : "",
            candidateEmail: finalistCandidate?.email ?? null,
          },
        };
      }

      return { success: true, vacancy: updatedVacancy.toJSON(), inngestEvent };
    } catch (error) {
      console.error("Error in TransitionVacancyStatusUseCase:", error);
      return {
        success: false,
        error: "Error al cambiar el estado de la vacante",
      };
    }
  }
}

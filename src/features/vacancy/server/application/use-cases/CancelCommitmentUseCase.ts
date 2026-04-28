import type { IVacancyCommitmentRepository } from "../../domain/interfaces/IVacancyCommitmentRepository";
import type { VacancyCommitmentDTO } from "@features/vacancy/frontend/types/vacancy.types";

interface CancelCommitmentInput {
  commitmentId: string;
  tenantId: string;
  userId: string;
  reason?: string | null;
}

interface CancelCommitmentOutput {
  success: boolean;
  commitment?: VacancyCommitmentDTO;
  error?: string;
}

export class CancelCommitmentUseCase {
  constructor(
    private readonly repository: IVacancyCommitmentRepository
  ) {}

  async execute(
    input: CancelCommitmentInput
  ): Promise<CancelCommitmentOutput> {
    try {
      // Find commitment
      const commitment = await this.repository.findById(
        input.commitmentId,
        input.tenantId
      );

      if (!commitment) {
        return {
          success: false,
          error: "Compromiso no encontrado",
        };
      }

      // Guard: must be PENDING
      if (!commitment.canCancel()) {
        return {
          success: false,
          error: "Solo los compromisos pendientes pueden cancelarse",
        };
      }

      // Update status
      const now = new Date();
      const updated = await this.repository.updateStatus(
        input.commitmentId,
        input.tenantId,
        {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledById: input.userId,
          cancelReason: input.reason?.trim() || undefined,
        }
      );

      // Append event
      await this.repository.appendEvent({
        commitmentId: input.commitmentId,
        tenantId: input.tenantId,
        previousStatus: commitment.status,
        newStatus: "CANCELLED",
        note: input.reason?.trim() ?? null,
        changedById: input.userId,
      });

      return {
        success: true,
        commitment: updated.toJSON(),
      };
    } catch (error) {
      console.error("Error in CancelCommitmentUseCase:", error);
      return {
        success: false,
        error: "Error al cancelar el compromiso",
      };
    }
  }
}

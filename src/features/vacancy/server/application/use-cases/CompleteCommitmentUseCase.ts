import type { IVacancyCommitmentRepository } from "../../domain/interfaces/IVacancyCommitmentRepository";
import type { VacancyCommitmentDTO } from "@features/vacancy/frontend/types/vacancy.types";

interface CompleteCommitmentInput {
  commitmentId: string;
  tenantId: string;
  userId: string;
  note?: string | null;
}

interface CompleteCommitmentOutput {
  success: boolean;
  commitment?: VacancyCommitmentDTO;
  error?: string;
}

export class CompleteCommitmentUseCase {
  constructor(
    private readonly repository: IVacancyCommitmentRepository
  ) {}

  async execute(
    input: CompleteCommitmentInput
  ): Promise<CompleteCommitmentOutput> {
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
      if (!commitment.canComplete()) {
        return {
          success: false,
          error: "Solo los compromisos pendientes pueden completarse",
        };
      }

      // Update status
      const now = new Date();
      const updated = await this.repository.updateStatus(
        input.commitmentId,
        input.tenantId,
        {
          status: "COMPLETED",
          completedAt: now,
          completedById: input.userId,
        }
      );

      // Append event
      await this.repository.appendEvent({
        commitmentId: input.commitmentId,
        tenantId: input.tenantId,
        previousStatus: commitment.status,
        newStatus: "COMPLETED",
        note: input.note ?? "Compromiso completado",
        changedById: input.userId,
      });

      return {
        success: true,
        commitment: updated.toJSON(),
      };
    } catch (error) {
      console.error("Error in CompleteCommitmentUseCase:", error);
      return {
        success: false,
        error: "Error al completar el compromiso",
      };
    }
  }
}

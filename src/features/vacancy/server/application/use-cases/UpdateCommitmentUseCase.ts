import type {
  IVacancyCommitmentRepository,
  UpdateCommitmentData,
} from "../../domain/interfaces/IVacancyCommitmentRepository";
import type { VacancyCommitmentDTO } from "@features/vacancy/frontend/types/vacancy.types";
import { parse, isValid, startOfDay, isBefore, format } from "date-fns";

interface UpdateCommitmentInput {
  commitmentId: string;
  tenantId: string;
  userId: string;
  description?: string;
  dueDate?: string;
}

interface UpdateCommitmentOutput {
  success: boolean;
  commitment?: VacancyCommitmentDTO;
  error?: string;
}

export class UpdateCommitmentUseCase {
  constructor(
    private readonly repository: IVacancyCommitmentRepository
  ) {}

  async execute(
    input: UpdateCommitmentInput
  ): Promise<UpdateCommitmentOutput> {
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
      if (!commitment.canEdit()) {
        return {
          success: false,
          error: "Solo los compromisos pendientes pueden editarse",
        };
      }

      // Track what changed
      const changes: string[] = [];
      const previousValues: string[] = [];
      const newValues: string[] = [];

      // Validate and prepare update data
      const updateData: UpdateCommitmentData = {};

      if (input.description !== undefined) {
        const trimmed = input.description.trim();
        if (trimmed.length < 2) {
          return {
            success: false,
            error: "La descripción debe tener al menos 2 caracteres",
          };
        }
        if (trimmed.length > 500) {
          return {
            success: false,
            error: "La descripción no puede exceder 500 caracteres",
          };
        }
        if (trimmed !== commitment.description) {
          updateData.description = trimmed;
          changes.push("descripción");
          previousValues.push(`"${commitment.description}"`);
          newValues.push(`"${trimmed}"`);
        }
      }

      if (input.dueDate !== undefined) {
        if (!input.dueDate) {
          return {
            success: false,
            error: "La fecha de vencimiento es obligatoria",
          };
        }
        
        // Parse yyyy-MM-dd format explicitly to avoid timezone offset bugs
        const newDueDate = parse(input.dueDate, "yyyy-MM-dd", new Date());
        if (!isValid(newDueDate)) {
          return {
            success: false,
            error: "Fecha de vencimiento inválida",
          };
        }
        
        // Compare calendar days (start of day) to avoid timezone issues
        const today = startOfDay(new Date());
        const newDueDateStart = startOfDay(newDueDate);
        if (isBefore(newDueDateStart, today)) {
          return {
            success: false,
            error: "La fecha de vencimiento no puede estar en el pasado",
          };
        }

        // Compare date-only strings
        const oldDueDateStr = format(commitment.dueDate, "yyyy-MM-dd");
        const newDueDateStr = format(newDueDate, "yyyy-MM-dd");

        if (oldDueDateStr !== newDueDateStr) {
          updateData.dueDate = newDueDate;
          changes.push("fecha de vencimiento");
          previousValues.push(oldDueDateStr);
          newValues.push(newDueDateStr);
        }
      }

      // If nothing changed, return success without updating
      if (changes.length === 0) {
        return {
          success: true,
          commitment: commitment.toJSON(),
        };
      }

      // Update commitment
      const updated = await this.repository.update(
        input.commitmentId,
        input.tenantId,
        updateData
      );

      // Append event describing changes
      const changeNote = changes
        .map((change, i) => `${change}: ${previousValues[i]} → ${newValues[i]}`)
        .join("; ");

      await this.repository.appendEvent({
        commitmentId: input.commitmentId,
        tenantId: input.tenantId,
        previousStatus: commitment.status,
        newStatus: commitment.status,
        note: `Editado: ${changeNote}`,
        changedById: input.userId,
      });

      return {
        success: true,
        commitment: updated.toJSON(),
      };
    } catch (error) {
      console.error("Error in UpdateCommitmentUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar el compromiso",
      };
    }
  }
}

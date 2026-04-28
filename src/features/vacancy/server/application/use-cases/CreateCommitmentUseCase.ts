import type {
  IVacancyCommitmentRepository,
  CreateCommitmentData,
} from "../../domain/interfaces/IVacancyCommitmentRepository";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import { parse, isValid, startOfDay, isBefore } from "date-fns";

interface CreateCommitmentInput {
  vacancyId: string;
  tenantId: string;
  description: string;
  dueDate: string; // ISO string from frontend - required
  createdById: string;
}

import type { VacancyCommitmentDTO } from "@features/vacancy/frontend/types/vacancy.types";

interface CreateCommitmentOutput {
  success: boolean;
  commitment?: VacancyCommitmentDTO;
  error?: string;
}

export class CreateCommitmentUseCase {
  constructor(
    private readonly repository: IVacancyCommitmentRepository,
    private readonly vacancyRepository: IVacancyRepository
  ) {}

  async execute(
    input: CreateCommitmentInput
  ): Promise<CreateCommitmentOutput> {
    try {
      // Verify vacancy exists in same tenant
      const vacancy = await this.vacancyRepository.findById(
        input.vacancyId,
        input.tenantId
      );
      if (!vacancy) {
        return {
          success: false,
          error: "Vacante no encontrada o no pertenece al tenant activo",
        };
      }

      // Validate description (2–500 chars)
      if (!input.description || input.description.trim().length < 2) {
        return {
          success: false,
          error: "La descripción debe tener al menos 2 caracteres",
        };
      }
      if (input.description.trim().length > 500) {
        return {
          success: false,
          error: "La descripción no puede exceder 500 caracteres",
        };
      }

      // Validate dueDate (required) - parse as date-only string to avoid timezone issues
      if (!input.dueDate) {
        return {
          success: false,
          error: "La fecha de vencimiento es obligatoria",
        };
      }
      
      // Parse yyyy-MM-dd format explicitly to avoid timezone offset bugs
      const dueDate = parse(input.dueDate, "yyyy-MM-dd", new Date());
      if (!isValid(dueDate)) {
        return {
          success: false,
          error: "Fecha de vencimiento inválida",
        };
      }
      
      // Compare calendar days (start of day) to avoid timezone issues
      const today = startOfDay(new Date());
      const dueDateStart = startOfDay(dueDate);
      if (isBefore(dueDateStart, today)) {
        return {
          success: false,
          error: "La fecha de vencimiento no puede estar en el pasado",
        };
      }

      // Set responsible user to vacancy recruiter (server-controlled for security)
      const responsibleUserId = vacancy.recruiterId;

      // Create commitment
      const data: CreateCommitmentData = {
        vacancyId: input.vacancyId,
        tenantId: input.tenantId,
        description: input.description.trim(),
        dueDate,
        responsibleUserId,
        createdById: input.createdById,
      };

      const commitment = await this.repository.create(data);

      // Append creation event (PENDING → PENDING)
      await this.repository.appendEvent({
        commitmentId: commitment.id,
        tenantId: input.tenantId,
        previousStatus: "PENDING",
        newStatus: "PENDING",
        note: "Compromiso creado",
        changedById: input.createdById,
      });

      return {
        success: true,
        commitment: commitment.toJSON(),
      };
    } catch (error) {
      console.error("Error in CreateCommitmentUseCase:", error);
      return {
        success: false,
        error: "Error al crear el compromiso",
      };
    }
  }
}

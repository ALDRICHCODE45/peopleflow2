import {
  IVacancyRepository,
  UpdateVacancyData,
} from "../../domain/interfaces/IVacancyRepository";
import { Vacancy, VacancyStatus } from "../../domain/entities/Vacancy";

export interface UpdateVacancyInput {
  id: string;
  tenantId: string;
  title?: string;
  description?: string;
  status?: VacancyStatus;
  department?: string | null;
  location?: string | null;
}

export interface UpdateVacancyOutput {
  success: boolean;
  vacancy?: Vacancy;
  error?: string;
}

export class UpdateVacancyUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: UpdateVacancyInput): Promise<UpdateVacancyOutput> {
    try {
      // Verificar que la vacante existe y pertenece al tenant
      const existingVacancy = await this.vacancyRepository.findById(
        input.id,
        input.tenantId
      );

      if (!existingVacancy) {
        return {
          success: false,
          error: "Vacante no encontrada",
        };
      }

      // Verificar si puede ser editada
      if (!existingVacancy.canEdit()) {
        return {
          success: false,
          error: "Esta vacante esta archivada y no puede ser editada",
        };
      }

      // Validar transicion de estado si se proporciona
      if (input.status && input.status !== existingVacancy.status) {
        const validTransitions = existingVacancy.getValidTransitions();
        if (!validTransitions.includes(input.status)) {
          return {
            success: false,
            error: `No se puede cambiar el estado de ${existingVacancy.status} a ${input.status}`,
          };
        }
      }

      // Validar longitudes maximas
      const title = input.title?.trim();
      const description = input.description?.trim();
      const department =
        input.department === null ? null : input.department?.trim();
      const location = input.location === null ? null : input.location?.trim();

      if (title !== undefined && title.length < 3) {
        return {
          success: false,
          error: "El titulo debe tener al menos 3 caracteres",
        };
      }

      if (title !== undefined && title.length > 200) {
        return {
          success: false,
          error: "El titulo no puede exceder 200 caracteres",
        };
      }

      if (description !== undefined && description.length < 10) {
        return {
          success: false,
          error: "La descripcion debe tener al menos 10 caracteres",
        };
      }

      if (description !== undefined && description.length > 5000) {
        return {
          success: false,
          error: "La descripcion no puede exceder 5000 caracteres",
        };
      }

      if (department && department.length > 100) {
        return {
          success: false,
          error: "El departamento no puede exceder 100 caracteres",
        };
      }

      if (location && location.length > 200) {
        return {
          success: false,
          error: "La ubicacion no puede exceder 200 caracteres",
        };
      }

      // Preparar datos de actualizacion
      const updateData: UpdateVacancyData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (input.status !== undefined) updateData.status = input.status;
      if (department !== undefined) updateData.department = department;
      if (location !== undefined) updateData.location = location;

      const vacancy = await this.vacancyRepository.update(
        input.id,
        input.tenantId,
        updateData
      );

      if (!vacancy) {
        return {
          success: false,
          error: "Error al actualizar vacante",
        };
      }

      return {
        success: true,
        vacancy,
      };
    } catch (error) {
      console.error("Error in UpdateVacancyUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar vacante",
      };
    }
  }
}

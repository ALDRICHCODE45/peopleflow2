import { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import { Vacancy, VacancyStatus } from "../../domain/entities/Vacancy";

export interface CreateVacancyInput {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
  tenantId: string;
}

export interface CreateVacancyOutput {
  success: boolean;
  vacancy?: Vacancy;
  error?: string;
}

export class CreateVacancyUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: CreateVacancyInput): Promise<CreateVacancyOutput> {
    try {
      const title = input.title?.trim() || "";
      const description = input.description?.trim() || "";
      const department = input.department?.trim() || null;
      const location = input.location?.trim() || null;

      // Validacion de longitud minima
      if (title.length < 3) {
        return {
          success: false,
          error: "El titulo debe tener al menos 3 caracteres",
        };
      }

      if (description.length < 10) {
        return {
          success: false,
          error: "La descripcion debe tener al menos 10 caracteres",
        };
      }

      // Validacion de longitud maxima
      if (title.length > 200) {
        return {
          success: false,
          error: "El titulo no puede exceder 200 caracteres",
        };
      }

      if (description.length > 5000) {
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

      // Validar que las nuevas vacantes solo pueden ser DRAFT u OPEN
      if (input.status && !["DRAFT", "OPEN"].includes(input.status)) {
        return {
          success: false,
          error: "Las nuevas vacantes solo pueden crearse como Borrador o Abierta",
        };
      }

      const vacancy = await this.vacancyRepository.create({
        title,
        description,
        status: input.status || "DRAFT",
        department: department || undefined,
        location: location || undefined,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        vacancy,
      };
    } catch (error) {
      console.error("Error in CreateVacancyUseCase:", error);
      return {
        success: false,
        error: "Error al crear vacante",
      };
    }
  }
}

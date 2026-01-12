import {
  IVacancyRepository,
  FindVacanciesFilters,
} from "../../domain/interfaces/IVacancyRepository";
import { Vacancy, VacancyStatus } from "../../domain/entities/Vacancy";

export interface GetVacanciesInput {
  tenantId: string;
  status?: VacancyStatus;
  department?: string;
  search?: string;
}

export interface GetVacanciesOutput {
  success: boolean;
  vacancies: Vacancy[];
  error?: string;
}

export class GetVacanciesUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: GetVacanciesInput): Promise<GetVacanciesOutput> {
    try {
      const filters: FindVacanciesFilters = {};

      if (input.status) filters.status = input.status;
      if (input.department) filters.department = input.department;
      if (input.search) filters.search = input.search;

      const vacancies = await this.vacancyRepository.findByTenantId(
        input.tenantId,
        filters
      );

      return {
        success: true,
        vacancies,
      };
    } catch (error) {
      console.error("Error in GetVacanciesUseCase:", error);
      return {
        success: false,
        vacancies: [],
        error: "Error al obtener vacantes",
      };
    }
  }
}

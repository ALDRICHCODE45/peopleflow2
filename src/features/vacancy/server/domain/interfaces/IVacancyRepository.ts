import { Vacancy, VacancyStatus } from "../entities/Vacancy";

/**
 * Interfaz del repositorio de Vacancies
 * Define el contrato para la capa de infraestructura
 */

export interface CreateVacancyData {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
  tenantId: string;
}

export interface UpdateVacancyData {
  title?: string;
  description?: string;
  status?: VacancyStatus;
  department?: string | null;
  location?: string | null;
}

export interface FindVacanciesFilters {
  status?: VacancyStatus;
  department?: string;
  search?: string;
}

export interface IVacancyRepository {
  /**
   * Encuentra una vacante por su ID
   */
  findById(id: string, tenantId: string): Promise<Vacancy | null>;

  /**
   * Obtiene todas las vacantes de un tenant
   */
  findByTenantId(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<Vacancy[]>;

  /**
   * Crea una nueva vacante
   */
  create(data: CreateVacancyData): Promise<Vacancy>;

  /**
   * Actualiza una vacante existente
   */
  update(
    id: string,
    tenantId: string,
    data: UpdateVacancyData
  ): Promise<Vacancy | null>;

  /**
   * Elimina una vacante
   */
  delete(id: string, tenantId: string): Promise<boolean>;

  /**
   * Cuenta vacantes por tenant y filtros
   */
  count(tenantId: string, filters?: FindVacanciesFilters): Promise<number>;
}

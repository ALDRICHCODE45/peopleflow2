import type { VacancySaleType } from "@features/vacancy/frontend/types/vacancy.types";

/**
 * Servicio de dominio puro — determina el tipo de venta de una nueva vacante.
 * NUEVA: es la primera vacante del cliente en este tenant.
 * RECOMPRA: el cliente ya tiene al menos una vacante previa en este tenant.
 * Solo lógica, sin I/O. El dato de vacantes existentes se le pasa desde fuera.
 */
export class VacancySaleTypeService {
  /**
   * @param existingVacanciesCount - Cantidad de vacantes que ya tiene el cliente en este tenant
   */
  static determine(existingVacanciesCount: number): VacancySaleType {
    return existingVacanciesCount > 0 ? "RECOMPRA" : "NUEVA";
  }
}

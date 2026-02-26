import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";
import { VacancyStatusVO } from "../value-objects/VacancyStatus";

export interface WorkflowValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Servicio de dominio — valida precondiciones de las transiciones de estado del workflow.
 * Centraliza las reglas de negocio para que múltiples use cases las reutilicen.
 * Solo lógica pura, sin I/O.
 */
export class VacancyWorkflowService {
  /**
   * Valida si una transición de estado es posible dado el estado actual.
   */
  static validateTransition(
    currentStatus: VacancyStatusType,
    newStatus: VacancyStatusType
  ): WorkflowValidationResult {
    const statusVO = VacancyStatusVO.create(currentStatus);
    if (!statusVO.canTransitionTo(newStatus)) {
      return {
        valid: false,
        error: `No se puede cambiar el estado de "${currentStatus}" a "${newStatus}"`,
      };
    }
    return { valid: true };
  }

  /**
   * Valida precondiciones para pasar a HUNTING.
   * Requiere: jobDescription definido + al menos 1 checklist item.
   */
  static validateReadyForHunting(
    jobDescription: string | null,
    checklistItemsCount: number
  ): WorkflowValidationResult {
    if (!jobDescription || jobDescription.trim().length === 0) {
      return {
        valid: false,
        error:
          "Se requiere el Job Description para iniciar la búsqueda (Hunting)",
      };
    }
    if (checklistItemsCount < 1) {
      return {
        valid: false,
        error:
          "Se requiere al menos un requisito en el checklist para iniciar la búsqueda",
      };
    }
    return { valid: true };
  }

  /**
   * Valida precondiciones para Validar Terna (→ FOLLOW_UP).
   * Requiere: al menos 1 candidato seleccionado para la terna.
   */
  static validateTerna(
    selectedCandidateIds: string[]
  ): WorkflowValidationResult {
    if (selectedCandidateIds.length === 0) {
      return {
        valid: false,
        error: "Debe seleccionar al menos un candidato para la terna",
      };
    }
    return { valid: true };
  }

  /**
   * Valida precondiciones para PRE_PLACEMENT.
   * Requiere: salario fijo cerrado + fecha de ingreso + finalista seleccionado.
   */
  static validatePrePlacement(
    salaryFixed: number | null,
    entryDate: Date | null,
    hasFinalist: boolean
  ): WorkflowValidationResult {
    if (!hasFinalist) {
      return {
        valid: false,
        error: "Debe seleccionar un candidato finalista",
      };
    }
    if (salaryFixed === null || salaryFixed === undefined) {
      return {
        valid: false,
        error:
          "El salario debe ser un monto cerrado y exacto para Pre-Placement (sin rangos)",
      };
    }
    if (!entryDate) {
      return {
        valid: false,
        error: "Se requiere la fecha exacta de ingreso para Pre-Placement",
      };
    }
    return { valid: true };
  }

  /**
   * Valida un rollback (retorno a HUNTING desde FOLLOW_UP o PRE_PLACEMENT).
   * Requiere: motivo + nueva fecha tentativa de entrega.
   */
  static validateRollback(
    currentStatus: VacancyStatusType,
    reason: string | null | undefined,
    newTargetDeliveryDate: Date | null | undefined
  ): WorkflowValidationResult {
    if (currentStatus !== "FOLLOW_UP" && currentStatus !== "PRE_PLACEMENT") {
      return {
        valid: false,
        error:
          "El retroceso solo está permitido desde Follow Up o Pre-Placement",
      };
    }
    if (!reason || reason.trim().length === 0) {
      return {
        valid: false,
        error: "Debe registrar el motivo del retroceso",
      };
    }
    if (!newTargetDeliveryDate) {
      return {
        valid: false,
        error:
          "Debe establecer una nueva fecha tentativa de entrega para el nuevo ciclo",
      };
    }
    return { valid: true };
  }

  /**
   * Valida transición a un estado manual secundario (STAND_BY, CANCELADA, PERDIDA).
   * Requiere: motivo obligatorio.
   */
  static validateSecondaryState(
    reason: string | null | undefined
  ): WorkflowValidationResult {
    if (!reason || reason.trim().length === 0) {
      return {
        valid: false,
        error: "Debe registrar el motivo del cambio de estado",
      };
    }
    return { valid: true };
  }
}

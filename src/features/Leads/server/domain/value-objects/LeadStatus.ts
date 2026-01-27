/**
 * Value Object para el estado del Lead
 * Encapsula la lógica de transiciones de estado válidas
 */

export type LeadStatusType =
  | "CONTACTO"
  | "CONTACTO_CALIDO"
  | "SOCIAL_SELLING"
  | "CITA_AGENDADA"
  | "CITA_ATENDIDA"
  | "CITA_VALIDADA"
  | "POSICIONES_ASIGNADAS"
  | "STAND_BY";

/**
 * Mapa de transiciones válidas para el workflow de leads
 * Define desde qué estados se puede transicionar a cuáles
 */
const VALID_TRANSITIONS: Record<LeadStatusType, LeadStatusType[]> = {
  CONTACTO: ["CONTACTO_CALIDO", "SOCIAL_SELLING", "STAND_BY"],
  CONTACTO_CALIDO: ["SOCIAL_SELLING", "CITA_AGENDADA", "STAND_BY"],
  SOCIAL_SELLING: ["CITA_AGENDADA", "STAND_BY", "CONTACTO_CALIDO"],
  CITA_AGENDADA: ["CITA_ATENDIDA", "STAND_BY", "CONTACTO_CALIDO"],
  CITA_ATENDIDA: ["CITA_VALIDADA", "CITA_AGENDADA", "STAND_BY"],
  CITA_VALIDADA: ["POSICIONES_ASIGNADAS", "STAND_BY"],
  POSICIONES_ASIGNADAS: ["STAND_BY"],
  STAND_BY: [
    "CONTACTO",
    "CONTACTO_CALIDO",
    "SOCIAL_SELLING",
    "CITA_AGENDADA",
    "CITA_ATENDIDA",
    "CITA_VALIDADA",
  ],
};

export class LeadStatusVO {
  private readonly value: LeadStatusType;

  private constructor(value: LeadStatusType) {
    this.value = value;
  }

  static create(value: string): LeadStatusVO {
    if (!LeadStatusVO.isValidStatus(value)) {
      throw new Error(`Estado de lead inválido: ${value}`);
    }
    return new LeadStatusVO(value as LeadStatusType);
  }

  static isValidStatus(value: string): value is LeadStatusType {
    return [
      "CONTACTO",
      "CONTACTO_CALIDO",
      "SOCIAL_SELLING",
      "CITA_AGENDADA",
      "CITA_ATENDIDA",
      "CITA_VALIDADA",
      "POSICIONES_ASIGNADAS",
      "STAND_BY",
    ].includes(value);
  }

  getValue(): LeadStatusType {
    return this.value;
  }

  /**
   * Obtiene los estados a los que se puede transicionar desde el estado actual
   */
  getValidTransitions(): LeadStatusType[] {
    return VALID_TRANSITIONS[this.value] || [];
  }

  /**
   * Verifica si se puede transicionar al estado especificado
   */
  canTransitionTo(newStatus: LeadStatusType): boolean {
    return this.getValidTransitions().includes(newStatus);
  }

  /**
   * Intenta crear una transición al nuevo estado
   * Lanza error si la transición no es válida
   */
  transitionTo(newStatus: LeadStatusType): LeadStatusVO {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Transición de estado no válida: ${this.value} → ${newStatus}`,
      );
    }
    return new LeadStatusVO(newStatus);
  }

  equals(other: LeadStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

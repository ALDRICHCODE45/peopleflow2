import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export type { VacancyStatusType };

// Estados del flujo principal (con triggers automáticos o manuales definidos)
export const PRIMARY_STATES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "PLACEMENT",
];

// Estados secundarios manuales — siempre requieren motivo (reason)
export const SECONDARY_STATES: VacancyStatusType[] = [
  "STAND_BY",
  "CANCELADA",
  "PERDIDA",
];

// Estados que requieren motivo obligatorio al transicionar hacia ellos
export const STATES_REQUIRING_REASON: VacancyStatusType[] = [
  "STAND_BY",
  "CANCELADA",
  "PERDIDA",
];

// Estados terminales — no admiten más transiciones hacia adelante
export const TERMINAL_STATES: VacancyStatusType[] = [
  "PLACEMENT",
  "CANCELADA",
  "PERDIDA",
];

// Mapa de transiciones válidas por estado
const VALID_TRANSITIONS: Record<VacancyStatusType, VacancyStatusType[]> = {
  QUICK_MEETING: ["HUNTING", "STAND_BY", "CANCELADA", "PERDIDA"],
  HUNTING: ["FOLLOW_UP", "STAND_BY", "CANCELADA", "PERDIDA"],
  // HUNTING como destino desde FOLLOW_UP/PRE_PLACEMENT = rollback
  FOLLOW_UP: ["HUNTING", "PRE_PLACEMENT", "STAND_BY", "CANCELADA", "PERDIDA"],
  PRE_PLACEMENT: ["PLACEMENT", "HUNTING", "STAND_BY", "CANCELADA", "PERDIDA"],
  PLACEMENT: [],
  STAND_BY: [
    "QUICK_MEETING",
    "HUNTING",
    "FOLLOW_UP",
    "PRE_PLACEMENT",
    "CANCELADA",
    "PERDIDA",
  ],
  CANCELADA: [],
  PERDIDA: [],
};

export class VacancyStatusVO {
  private readonly value: VacancyStatusType;

  private constructor(value: VacancyStatusType) {
    this.value = value;
  }

  static create(value: string): VacancyStatusVO {
    if (!VacancyStatusVO.isValidStatus(value)) {
      throw new Error(`Estado de vacante inválido: "${value}"`);
    }
    return new VacancyStatusVO(value);
  }

  static isValidStatus(value: string): value is VacancyStatusType {
    return [
      "QUICK_MEETING",
      "HUNTING",
      "FOLLOW_UP",
      "PRE_PLACEMENT",
      "PLACEMENT",
      "STAND_BY",
      "CANCELADA",
      "PERDIDA",
    ].includes(value);
  }

  getValue(): VacancyStatusType {
    return this.value;
  }

  getValidTransitions(): VacancyStatusType[] {
    return VALID_TRANSITIONS[this.value] ?? [];
  }

  canTransitionTo(newStatus: VacancyStatusType): boolean {
    return this.getValidTransitions().includes(newStatus);
  }

  requiresReason(newStatus: VacancyStatusType): boolean {
    return (
      STATES_REQUIRING_REASON.includes(newStatus) ||
      this.isRollbackTransition(newStatus)
    );
  }

  isRollbackTransition(newStatus: VacancyStatusType): boolean {
    return (
      newStatus === "HUNTING" &&
      (this.value === "FOLLOW_UP" || this.value === "PRE_PLACEMENT")
    );
  }

  isTerminal(): boolean {
    return TERMINAL_STATES.includes(this.value);
  }

  isSecondary(): boolean {
    return SECONDARY_STATES.includes(this.value);
  }

  equals(other: VacancyStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

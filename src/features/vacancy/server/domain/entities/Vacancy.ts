/**
 * Entidad de dominio Vacancy
 * Representa una vacante de trabajo en el sistema multi-tenant
 */

import type { Vacancy as VacancyDTO } from "../../../frontend/types/vacancy.types";

export type VacancyStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface VacancyProps {
  id: string;
  title: string;
  description: string;
  status: VacancyStatus;
  department: string | null;
  location: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Vacancy {
  private readonly props: VacancyProps;

  constructor(props: VacancyProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): VacancyStatus {
    return this.props.status;
  }

  get department(): string | null {
    return this.props.department;
  }

  get location(): string | null {
    return this.props.location;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Verifica si la vacante está abierta para aplicaciones
   */
  isOpen(): boolean {
    return this.props.status === "OPEN";
  }

  /**
   * Verifica si la vacante puede ser editada
   */
  canEdit(): boolean {
    return this.props.status !== "ARCHIVED";
  }

  /**
   * Obtiene las transiciones de estado válidas
   */
  getValidTransitions(): VacancyStatus[] {
    switch (this.props.status) {
      case "DRAFT":
        return ["OPEN", "ARCHIVED"];
      case "OPEN":
        return ["CLOSED", "ARCHIVED"];
      case "CLOSED":
        return ["OPEN", "ARCHIVED"];
      case "ARCHIVED":
        return [];
      default:
        return [];
    }
  }

  toJSON(): VacancyDTO {
    return {
      id: this.props.id,
      title: this.props.title,
      description: this.props.description,
      status: this.props.status,
      department: this.props.department,
      location: this.props.location,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

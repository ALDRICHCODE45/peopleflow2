import type { VacancyChecklistItemDTO } from "@features/vacancy/frontend/types/vacancy.types";

export interface VacancyChecklistItemProps {
  id: string;
  vacancyId: string;
  requirement: string;
  isCompleted: boolean;
  order: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VacancyChecklistItem {
  private readonly props: VacancyChecklistItemProps;

  constructor(props: VacancyChecklistItemProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get vacancyId(): string {
    return this.props.vacancyId;
  }

  get requirement(): string {
    return this.props.requirement;
  }

  get isCompleted(): boolean {
    return this.props.isCompleted;
  }

  get order(): number {
    return this.props.order;
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

  // --- Métodos de dominio (inmutables — retornan nueva instancia) ---

  /** Retorna una nueva instancia con isCompleted = true */
  complete(): VacancyChecklistItem {
    return new VacancyChecklistItem({
      ...this.props,
      isCompleted: true,
    });
  }

  /** Retorna una nueva instancia con isCompleted = false */
  uncomplete(): VacancyChecklistItem {
    return new VacancyChecklistItem({
      ...this.props,
      isCompleted: false,
    });
  }

  /**
   * Retorna una nueva instancia con el requirement actualizado.
   * Lanza Error si el texto está vacío.
   */
  updateRequirement(text: string): VacancyChecklistItem {
    if (!text || text.trim().length === 0) {
      throw new Error("El requisito del checklist no puede estar vacío");
    }
    return new VacancyChecklistItem({
      ...this.props,
      requirement: text.trim(),
    });
  }

  toJSON(): VacancyChecklistItemDTO {
    return {
      id: this.props.id,
      vacancyId: this.props.vacancyId,
      requirement: this.props.requirement,
      isCompleted: this.props.isCompleted,
      order: this.props.order,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

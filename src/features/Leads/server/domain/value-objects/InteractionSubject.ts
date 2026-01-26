/**
 * Value Object para el asunto de una interacción
 * Valida longitud entre 2 y 200 caracteres
 */
export class InteractionSubjectVO {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): InteractionSubjectVO {
    const trimmed = value?.trim() || "";

    if (trimmed.length < 2) {
      throw new Error("El asunto debe tener al menos 2 caracteres");
    }

    if (trimmed.length > 200) {
      throw new Error("El asunto no puede exceder 200 caracteres");
    }

    return new InteractionSubjectVO(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InteractionSubjectVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

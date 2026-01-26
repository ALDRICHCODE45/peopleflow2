/**
 * Value Object para el nombre de la empresa
 * Valida longitud entre 2 y 200 caracteres
 */
export class CompanyNameVO {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): CompanyNameVO {
    const trimmed = value?.trim() || "";

    if (trimmed.length < 2) {
      throw new Error(
        "El nombre de la empresa debe tener al menos 2 caracteres",
      );
    }

    if (trimmed.length > 200) {
      throw new Error(
        "El nombre de la empresa no puede exceder 200 caracteres",
      );
    }

    return new CompanyNameVO(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CompanyNameVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

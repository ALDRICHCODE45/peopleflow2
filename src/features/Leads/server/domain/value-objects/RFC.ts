/**
 * Value Object para el RFC (Registro Federal de Contribuyentes)
 * Valida máximo 13 caracteres, acepta valores nulos
 */
export class RFCVO {
  private readonly value: string | null;

  private constructor(value: string | null) {
    this.value = value;
  }

  static create(value: string | null | undefined): RFCVO {
    if (!value || value.trim() === "") {
      return new RFCVO(null);
    }

    const trimmed = value.trim();

    if (trimmed.length > 13) {
      throw new Error("El RFC no puede exceder 13 caracteres");
    }

    return new RFCVO(trimmed);
  }

  getValue(): string | null {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === null;
  }

  equals(other: RFCVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? "";
  }
}

/**
 * Value Object para URLs (website, linkedInUrl, etc.)
 * Valida máximo 500 caracteres, acepta valores nulos
 */
export class URLVO {
  private readonly value: string | null;

  private constructor(value: string | null) {
    this.value = value;
  }

  static create(value: string | null | undefined): URLVO {
    if (!value || value.trim() === "") {
      return new URLVO(null);
    }

    const trimmed = value.trim();

    if (trimmed.length > 500) {
      throw new Error("La URL no puede exceder 500 caracteres");
    }

    return new URLVO(trimmed);
  }

  getValue(): string | null {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === null;
  }

  equals(other: URLVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? "";
  }
}

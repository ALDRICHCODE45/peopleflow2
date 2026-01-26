/**
 * Value Object para direcciones de email
 * Valida formato con regex, acepta valores nulos
 */
export class EmailVO {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private readonly value: string | null;

  private constructor(value: string | null) {
    this.value = value;
  }

  static create(value: string | null | undefined): EmailVO {
    if (!value || value.trim() === "") {
      return new EmailVO(null);
    }

    const trimmed = value.trim();

    if (!EmailVO.EMAIL_REGEX.test(trimmed)) {
      throw new Error("El email no tiene un formato válido");
    }

    return new EmailVO(trimmed);
  }

  getValue(): string | null {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === null;
  }

  equals(other: EmailVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? "";
  }
}

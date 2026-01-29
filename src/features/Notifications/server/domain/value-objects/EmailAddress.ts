export class EmailAddressVO {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EmailAddressVO {
    const trimmed = value?.trim() || "";
    if (!trimmed) {
      throw new Error("El email es requerido");
    }
    if (!EmailAddressVO.EMAIL_REGEX.test(trimmed)) {
      throw new Error("El email no tiene un formato válido");
    }
    return new EmailAddressVO(trimmed);
  }

  static isValid(value: string): boolean {
    const trimmed = value?.trim() || "";
    return trimmed.length > 0 && EmailAddressVO.EMAIL_REGEX.test(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EmailAddressVO): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}

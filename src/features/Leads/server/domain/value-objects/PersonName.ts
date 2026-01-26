/**
 * Value Object para nombres de personas (firstName + lastName)
 * Valida longitud entre 2 y 100 caracteres para cada componente
 */
export class PersonNameVO {
  private readonly firstName: string;
  private readonly lastName: string;

  private constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  static create(firstName: string, lastName: string): PersonNameVO {
    const trimmedFirst = firstName?.trim() || "";
    const trimmedLast = lastName?.trim() || "";

    if (trimmedFirst.length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (trimmedFirst.length > 100) {
      throw new Error("El nombre no puede exceder 100 caracteres");
    }

    if (trimmedLast.length < 2) {
      throw new Error("El apellido debe tener al menos 2 caracteres");
    }

    if (trimmedLast.length > 100) {
      throw new Error("El apellido no puede exceder 100 caracteres");
    }

    return new PersonNameVO(trimmedFirst, trimmedLast);
  }

  /**
   * Para validación parcial (update de solo firstName o lastName)
   * Usa los valores existentes para los campos no proporcionados
   */
  static createPartial(
    firstName: string | undefined,
    lastName: string | undefined,
    existing: { firstName: string; lastName: string }
  ): PersonNameVO {
    return PersonNameVO.create(
      firstName ?? existing.firstName,
      lastName ?? existing.lastName
    );
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  equals(other: PersonNameVO): boolean {
    return this.firstName === other.firstName && this.lastName === other.lastName;
  }

  toString(): string {
    return this.getFullName();
  }
}

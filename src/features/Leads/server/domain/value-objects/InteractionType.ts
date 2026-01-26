/**
 * Value Object para el tipo de interacción
 * Valida que sea uno de los tipos permitidos
 */
export type InteractionTypeValue =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "LINKEDIN"
  | "WHATSAPP";

const VALID_TYPES: InteractionTypeValue[] = [
  "CALL",
  "EMAIL",
  "MEETING",
  "NOTE",
  "LINKEDIN",
  "WHATSAPP",
];

export class InteractionTypeVO {
  private readonly value: InteractionTypeValue;

  private constructor(value: InteractionTypeValue) {
    this.value = value;
  }

  static create(value: string): InteractionTypeVO {
    if (!InteractionTypeVO.isValidType(value)) {
      throw new Error(`Tipo de interacción no válido: ${value}`);
    }
    return new InteractionTypeVO(value as InteractionTypeValue);
  }

  static isValidType(value: string): value is InteractionTypeValue {
    return VALID_TYPES.includes(value as InteractionTypeValue);
  }

  static getValidTypes(): InteractionTypeValue[] {
    return [...VALID_TYPES];
  }

  getValue(): InteractionTypeValue {
    return this.value;
  }

  equals(other: InteractionTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

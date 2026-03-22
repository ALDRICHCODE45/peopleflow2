/**
 * Entidad de dominio Client
 * Representa un cliente convertido desde un Lead
 */

import type {
  Currency,
  PaymentScheme,
  AdvanceType,
  FeeType,
} from "@/core/generated/prisma/client";

export interface ClientProps {
  id: string;
  nombre: string;
  leadId: string;
  generadorId: string | null;
  generadorName?: string | null;
  origenId: string | null;
  origenName?: string | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Condiciones comerciales
  currency: Currency | null;
  initialPositions: number | null;
  paymentScheme: PaymentScheme | null;
  advanceType: AdvanceType | null;
  advanceValue: number | null;
  feeType: FeeType | null;
  feeValue: number | null;
  creditDays: number | null;
  cancellationFee: number | null;
  warrantyMonths: number | null;
}

export class Client {
  private readonly props: ClientProps;

  constructor(props: ClientProps) {
    this.props = props;
  }

  // --- Identidad ---

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get leadId(): string {
    return this.props.leadId;
  }

  get generadorId(): string | null {
    return this.props.generadorId;
  }

  get generadorName(): string | null | undefined {
    return this.props.generadorName;
  }

  get origenId(): string | null {
    return this.props.origenId;
  }

  get origenName(): string | null | undefined {
    return this.props.origenName;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdById(): string | null {
    return this.props.createdById;
  }

  get createdByName(): string | null | undefined {
    return this.props.createdByName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Condiciones comerciales ---

  get currency(): Currency | null {
    return this.props.currency;
  }

  get initialPositions(): number | null {
    return this.props.initialPositions;
  }

  get paymentScheme(): PaymentScheme | null {
    return this.props.paymentScheme;
  }

  get advanceType(): AdvanceType | null {
    return this.props.advanceType;
  }

  get advanceValue(): number | null {
    return this.props.advanceValue;
  }

  get feeType(): FeeType | null {
    return this.props.feeType;
  }

  get feeValue(): number | null {
    return this.props.feeValue;
  }

  get creditDays(): number | null {
    return this.props.creditDays;
  }

  get cancellationFee(): number | null {
    return this.props.cancellationFee;
  }

  get warrantyMonths(): number | null {
    return this.props.warrantyMonths;
  }

  // --- Domain methods ---

  /**
   * Retorna true si el cliente tiene al menos paymentScheme definido
   * (indica que se completaron las condiciones comerciales)
   */
  hasCommercialTerms(): boolean {
    return this.props.paymentScheme !== null;
  }

  toJSON() {
    return {
      id: this.props.id,
      nombre: this.props.nombre,
      leadId: this.props.leadId,
      generadorId: this.props.generadorId,
      generadorName: this.props.generadorName,
      origenId: this.props.origenId,
      origenName: this.props.origenName,
      tenantId: this.props.tenantId,
      createdById: this.props.createdById,
      createdByName: this.props.createdByName,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      // Condiciones comerciales
      currency: this.props.currency,
      initialPositions: this.props.initialPositions,
      paymentScheme: this.props.paymentScheme,
      advanceType: this.props.advanceType,
      advanceValue: this.props.advanceValue,
      feeType: this.props.feeType,
      feeValue: this.props.feeValue,
      creditDays: this.props.creditDays,
      cancellationFee: this.props.cancellationFee,
      warrantyMonths: this.props.warrantyMonths,
    };
  }
}

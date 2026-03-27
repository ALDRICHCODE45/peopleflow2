/**
 * Entidad de dominio Invoice
 * Representa una factura dentro del módulo de facturación
 */

import type {
  AdvanceType,
  Currency,
  FeeType,
  InvoiceType,
  InvoicePaymentType,
  InvoiceStatus,
} from "@/core/generated/prisma/client";

// --- DTO (dates as ISO strings for client boundary) ---

export interface InvoiceDTO {
  id: string;
  folio: string;
  type: InvoiceType;
  paymentType: InvoicePaymentType;
  clientId: string;
  clientName: string | null;
  vacancyId: string | null;
  anticipoInvoiceId: string | null;
  anticipoFolio: string | null;
  anticipoTotal: number | null;
  // Snapshots: Candidato
  candidateId: string | null;
  candidateName: string | null;
  // Snapshots: Hunter
  hunterId: string | null;
  hunterName: string | null;
  // Snapshots: Datos fiscales
  razonSocial: string | null;
  nombreComercial: string | null;
  ubicacion: string | null;
  figura: string | null;
  rfc: string | null;
  codigoPostal: string | null;
  regimen: string | null;
  // Snapshots: Vacante
  posicion: string | null;
  // Economics
  currency: Currency;
  salario: number | null;
  feeType: FeeType | null;
  feeValue: number | null;
  advanceType: AdvanceType | null;
  advanceValue: number | null;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  anticipoDeduccion: number;
  total: number;
  // Dates (ISO strings)
  issuedAt: string;
  paymentDate: string | null;
  mesPlacement: string | null;
  // State
  status: InvoiceStatus;
  banco: string | null;
  hasComplemento: boolean;
  // Tenant + audit
  tenantId: string;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Props (domain-level, dates as Date) ---

export interface InvoiceProps {
  id: string;
  folio: string;
  type: InvoiceType;
  paymentType: InvoicePaymentType;
  clientId: string;
  clientName?: string | null;
  vacancyId: string | null;
  anticipoInvoiceId: string | null;
  anticipoFolio?: string | null;
  anticipoTotal?: number | null;
  // Snapshots: Candidato
  candidateId: string | null;
  candidateName: string | null;
  // Snapshots: Hunter
  hunterId: string | null;
  hunterName: string | null;
  // Snapshots: Datos fiscales
  razonSocial: string | null;
  nombreComercial: string | null;
  ubicacion: string | null;
  figura: string | null;
  rfc: string | null;
  codigoPostal: string | null;
  regimen: string | null;
  // Snapshots: Vacante
  posicion: string | null;
  // Economics
  currency: Currency;
  salario: number | null;
  feeType: FeeType | null;
  feeValue: number | null;
  advanceType: AdvanceType | null;
  advanceValue: number | null;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  anticipoDeduccion: number;
  total: number;
  // Dates
  issuedAt: Date;
  paymentDate: Date | null;
  mesPlacement: Date | null;
  // State
  status: InvoiceStatus;
  banco: string | null;
  hasComplemento?: boolean;
  // Tenant + audit
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Invoice {
  private readonly props: InvoiceProps;

  constructor(props: InvoiceProps) {
    this.props = props;
  }

  // --- Identidad ---

  get id(): string {
    return this.props.id;
  }

  get folio(): string {
    return this.props.folio;
  }

  get type(): InvoiceType {
    return this.props.type;
  }

  get paymentType(): InvoicePaymentType {
    return this.props.paymentType;
  }

  // --- Relaciones ---

  get clientId(): string {
    return this.props.clientId;
  }

  get clientName(): string | null | undefined {
    return this.props.clientName;
  }

  get vacancyId(): string | null {
    return this.props.vacancyId;
  }

  get anticipoInvoiceId(): string | null {
    return this.props.anticipoInvoiceId;
  }

  get anticipoFolio(): string | null | undefined {
    return this.props.anticipoFolio;
  }

  get anticipoTotal(): number | null | undefined {
    return this.props.anticipoTotal;
  }

  // --- Snapshots: Candidato ---

  get candidateId(): string | null {
    return this.props.candidateId;
  }

  get candidateName(): string | null {
    return this.props.candidateName;
  }

  // --- Snapshots: Hunter ---

  get hunterId(): string | null {
    return this.props.hunterId;
  }

  get hunterName(): string | null {
    return this.props.hunterName;
  }

  // --- Snapshots: Datos fiscales ---

  get razonSocial(): string | null {
    return this.props.razonSocial;
  }

  get nombreComercial(): string | null {
    return this.props.nombreComercial;
  }

  get ubicacion(): string | null {
    return this.props.ubicacion;
  }

  get figura(): string | null {
    return this.props.figura;
  }

  get rfc(): string | null {
    return this.props.rfc;
  }

  get codigoPostal(): string | null {
    return this.props.codigoPostal;
  }

  get regimen(): string | null {
    return this.props.regimen;
  }

  // --- Snapshots: Vacante ---

  get posicion(): string | null {
    return this.props.posicion;
  }

  // --- Datos económicos ---

  get currency(): Currency {
    return this.props.currency;
  }

  get salario(): number | null {
    return this.props.salario;
  }

  get feeType(): FeeType | null {
    return this.props.feeType;
  }

  get feeValue(): number | null {
    return this.props.feeValue;
  }

  get advanceType(): AdvanceType | null {
    return this.props.advanceType;
  }

  get advanceValue(): number | null {
    return this.props.advanceValue;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get ivaRate(): number {
    return this.props.ivaRate;
  }

  get ivaAmount(): number {
    return this.props.ivaAmount;
  }

  get anticipoDeduccion(): number {
    return this.props.anticipoDeduccion;
  }

  get total(): number {
    return this.props.total;
  }

  // --- Fechas ---

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get paymentDate(): Date | null {
    return this.props.paymentDate;
  }

  get mesPlacement(): Date | null {
    return this.props.mesPlacement;
  }

  // --- Estado ---

  get status(): InvoiceStatus {
    return this.props.status;
  }

  get banco(): string | null {
    return this.props.banco;
  }

  // --- Tenant + auditoría ---

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

  // --- Domain methods ---

  /**
   * Retorna true si la factura es de tipo ANTICIPO
   */
  isAnticipo(): boolean {
    return this.props.type === "ANTICIPO";
  }

  /**
   * Retorna true si la factura es de tipo FULL
   */
  isFull(): boolean {
    return this.props.type === "FULL";
  }

  /**
   * Retorna true si la factura es de tipo LIQUIDACION
   */
  isLiquidacion(): boolean {
    return this.props.type === "LIQUIDACION";
  }

  /**
   * Retorna true si el tipo de pago es PPD (Pago en Parcialidades o Diferido)
   */
  isPPD(): boolean {
    return this.props.paymentType === "PPD";
  }

  /**
   * Retorna true si el tipo de pago es PUE (Pago en Una Exhibición)
   */
  isPUE(): boolean {
    return this.props.paymentType === "PUE";
  }

  /**
   * Retorna true si la factura ya fue pagada
   */
  isPagada(): boolean {
    return this.props.status === "PAGADA";
  }

  /**
   * Retorna true si la factura está por cobrar
   */
  isPorCobrar(): boolean {
    return this.props.status === "POR_COBRAR";
  }

  /**
   * Determina si la factura puede marcarse como pagada.
   * - PPD: requiere que exista un complemento de pago adjunto
   * - PUE: siempre permitido si está POR_COBRAR
   */
  canMarkAsPaid(hasComplemento: boolean): boolean {
    if (!this.isPorCobrar()) return false;
    if (this.isPPD()) return hasComplemento;
    return true;
  }

  /**
   * Determina si se puede registrar fecha de pago.
   * Misma validación PPD que canMarkAsPaid.
   */
  canSetFechaPago(hasComplemento: boolean): boolean {
    if (this.isPPD()) return hasComplemento;
    return true;
  }

  /**
   * Retorna true si esta factura PPD requiere complemento de pago
   */
  requiresComplemento(): boolean {
    return this.isPPD();
  }

  /**
   * Retorna true si esta factura (LIQUIDACION) requiere un anticipo vinculado
   */
  requiresAnticipo(): boolean {
    return this.isLiquidacion();
  }

  /**
   * Retorna true si esta factura tiene un anticipo vinculado
   */
  hasAnticipo(): boolean {
    return this.props.anticipoInvoiceId !== null;
  }

  // --- Serialización ---

  toJSON(): InvoiceDTO {
    return {
      id: this.props.id,
      folio: this.props.folio,
      type: this.props.type,
      paymentType: this.props.paymentType,
      clientId: this.props.clientId,
      clientName: this.props.clientName ?? null,
      vacancyId: this.props.vacancyId,
      anticipoInvoiceId: this.props.anticipoInvoiceId,
      anticipoFolio: this.props.anticipoFolio ?? null,
      anticipoTotal: this.props.anticipoTotal ?? null,
      candidateId: this.props.candidateId,
      candidateName: this.props.candidateName,
      hunterId: this.props.hunterId,
      hunterName: this.props.hunterName,
      razonSocial: this.props.razonSocial,
      nombreComercial: this.props.nombreComercial,
      ubicacion: this.props.ubicacion,
      figura: this.props.figura,
      rfc: this.props.rfc,
      codigoPostal: this.props.codigoPostal,
      regimen: this.props.regimen,
      posicion: this.props.posicion,
      currency: this.props.currency,
      salario: this.props.salario,
      feeType: this.props.feeType,
      feeValue: this.props.feeValue,
      advanceType: this.props.advanceType ?? null,
      advanceValue: this.props.advanceValue ?? null,
      subtotal: this.props.subtotal,
      ivaRate: this.props.ivaRate,
      ivaAmount: this.props.ivaAmount,
      anticipoDeduccion: this.props.anticipoDeduccion,
      total: this.props.total,
      issuedAt: this.props.issuedAt.toISOString(),
      paymentDate: this.props.paymentDate?.toISOString() ?? null,
      mesPlacement: this.props.mesPlacement?.toISOString() ?? null,
      status: this.props.status,
      banco: this.props.banco,
      hasComplemento: this.props.hasComplemento ?? false,
      tenantId: this.props.tenantId,
      createdById: this.props.createdById,
      createdByName: this.props.createdByName ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

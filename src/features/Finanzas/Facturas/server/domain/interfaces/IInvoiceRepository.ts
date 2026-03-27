/**
 * Interfaz del repositorio de Facturas
 * Define el contrato para la capa de infraestructura
 */

import type {
  AdvanceType,
  Currency,
  FeeType,
  InvoicePaymentType,
  InvoiceStatus,
  InvoiceType,
  PaymentScheme,
} from "@/core/generated/prisma/client";
import type { Invoice } from "../entities/Invoice";

// --- Pagination types ---

export interface FindPaginatedInvoicesParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: InvoiceFilters;
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedInvoiceResult {
  data: Invoice[];
  totalCount: number;
}

export interface ClientBillingSnapshot {
  id: string;
  tenantId: string;
  currency: Currency | null;
  feeType: FeeType | null;
  feeValue: number | null;
  advanceType: AdvanceType | null;
  advanceValue: number | null;
  paymentScheme: PaymentScheme | null;
}

export interface VacancyBillingSnapshot {
  id: string;
  tenantId: string;
  clientId: string;
  isWarranty: boolean;
}

// --- Create / Update DTOs ---

export interface CreateInvoiceData {
  folio: string;
  type: InvoiceType;
  paymentType: InvoicePaymentType;
  clientId: string;
  vacancyId: string | null;
  anticipoInvoiceId: string | null;
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
  mesPlacement: Date | null;
  // Additional
  banco: string | null;
  // Multi-tenancy + audit
  tenantId: string;
  createdById: string | null;
}

export interface UpdateInvoiceData {
  // Snapshots editables
  candidateId?: string | null;
  candidateName?: string | null;
  hunterId?: string | null;
  hunterName?: string | null;
  razonSocial?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  figura?: string | null;
  rfc?: string | null;
  codigoPostal?: string | null;
  regimen?: string | null;
  posicion?: string | null;
  // Economics (trigger recalculation in use case)
  currency?: Currency;
  salario?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  advanceType?: AdvanceType | null;
  advanceValue?: number | null;
  subtotal?: number;
  ivaRate?: number;
  ivaAmount?: number;
  anticipoDeduccion?: number;
  total?: number;
  // Dates
  issuedAt?: Date;
  paymentDate?: Date | null;
  mesPlacement?: Date | null;
  // Additional
  banco?: string | null;
  // Vacancy (editable on ANTICIPO)
  vacancyId?: string | null;
}

export interface IInvoiceRepository {
  /**
   * Crea una nueva factura
   */
  create(data: CreateInvoiceData): Promise<Invoice>;

  /**
   * Actualiza una factura existente con scope de tenant
   */
  update(id: string, data: UpdateInvoiceData, tenantId: string): Promise<Invoice>;

  /**
   * Busca una factura por ID con scope de tenant (incluye relaciones hydrated)
   */
  findByIdWithTenant(id: string, tenantId: string): Promise<Invoice | null>;

  /**
   * Obtiene facturas paginadas con filtros y ordenamiento
   */
  findPaginated(params: FindPaginatedInvoicesParams): Promise<PaginatedInvoiceResult>;

  /**
   * Elimina una factura con scope de tenant
   */
  delete(id: string, tenantId: string): Promise<void>;

  /**
   * Actualiza el estado de una factura (POR_COBRAR → PAGADA)
   */
  updateStatus(
    id: string,
    status: InvoiceStatus,
    paymentDate: Date | null,
    tenantId: string
  ): Promise<Invoice>;

  /**
   * Busca anticipos disponibles (no consumidos) para un cliente
   * Un anticipo está consumido si tiene una liquidación vinculada
   */
  findAvailableAnticiposByClient(
    clientId: string,
    tenantId: string
  ): Promise<Invoice[]>;

  /**
   * Genera el siguiente folio atómicamente dentro de una transacción
   * Formato: "{prefix}{counter}" e.g. "A001", "A522"
   */
  getNextFolio(tenantId: string): Promise<string>;

  /**
   * Verifica si existe un attachment de complemento de pago para la factura
   */
  hasComplementoAttachment(
    invoiceId: string,
    tenantId: string
  ): Promise<boolean>;

  /**
   * Obtiene snapshot mínimo del cliente para reglas de facturación.
   */
  findClientBillingSnapshot(
    clientId: string,
    tenantId: string
  ): Promise<ClientBillingSnapshot | null>;

  /**
   * Obtiene snapshot mínimo de vacante para validaciones de negocio.
   */
  findVacancyBillingSnapshot(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyBillingSnapshot | null>;
}

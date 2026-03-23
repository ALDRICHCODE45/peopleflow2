/**
 * Interfaz del repositorio de Clientes
 * Define el contrato para la capa de infraestructura
 */

import type {
  Currency,
  PaymentScheme,
  AdvanceType,
  FeeType,
} from "@/core/generated/prisma/client";
import { Client } from "../entities/Client";

// --- Pagination types ---

export interface FindPaginatedClientsParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: FindClientsFilters;
}

export interface FindClientsFilters {
  search?: string;
}

export interface PaginatedClientResult {
  data: Client[];
  totalCount: number;
}

// --- Fiscal data ---

export interface FiscalData {
  rfc?: string | null;
  codigoPostalFiscal?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  regimenFiscal?: string | null;
  figura?: string | null;
}

// --- Commercial terms ---

export interface CommercialTermsData {
  currency?: Currency | null;
  initialPositions?: number | null;
  paymentScheme?: PaymentScheme | null;
  advanceType?: AdvanceType | null;
  advanceValue?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  creditDays?: number | null;
  cancellationFee?: number | null;
  warrantyMonths?: number | null;
}

export interface CreateClientData {
  nombre: string;
  leadId: string;
  generadorId: string | null;
  origenId: string | null;
  tenantId: string;
  createdById: string | null;
  commercialTerms?: CommercialTermsData;
}

export interface UpdateClientData {
  nombre?: string;
  commercialTerms?: CommercialTermsData;
  fiscalData?: FiscalData;
}

export interface IClientRepository {
  /**
   * Crea un nuevo cliente
   */
  create(data: CreateClientData): Promise<Client>;

  /**
   * Busca un cliente por ID con scope de tenant
   */
  findByIdWithTenant(id: string, tenantId: string): Promise<Client | null>;

  /**
   * Busca un cliente por el ID del Lead original
   */
  findByLeadId(leadId: string, tenantId: string): Promise<Client | null>;

  /**
   * Devuelve id, nombre y currency de todos los clientes de un tenant (para selects)
   */
  findAllByTenantId(tenantId: string): Promise<{ id: string; nombre: string; currency: string | null }[]>;

  /**
   * Devuelve todos los clientes del tenant con datos completos (para listado)
   */
  findAllWithDetailsByTenantId(tenantId: string): Promise<Client[]>;

  /**
   * Obtiene clientes paginados con filtros y ordenamiento
   */
  findPaginated(params: FindPaginatedClientsParams): Promise<PaginatedClientResult>;

  /**
   * Actualiza un cliente existente con scope de tenant
   */
  update(id: string, data: UpdateClientData, tenantId: string): Promise<Client>;
}

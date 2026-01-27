/**
 * Interfaz del repositorio de Leads
 * Define el contrato para la capa de infraestructura
 */

import { Lead } from "../entities/Lead";
import type { LeadStatusType } from "../value-objects/LeadStatus";

export interface CreateLeadData {
  companyName: string;
  rfc?: string | null;
  website?: string | null;
  linkedInUrl?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: LeadStatusType;
  sectorId?: string | null;
  subsectorId?: string | null;
  originId?: string | null;
  assignedToId?: string | null;
  tenantId: string;
  createdById?: string | null;
}

export interface UpdateLeadData {
  companyName?: string;
  rfc?: string | null;
  website?: string | null;
  linkedInUrl?: string | null;
  address?: string | null;
  notes?: string | null;
  sectorId?: string | null;
  subsectorId?: string | null;
  originId?: string | null;
  assignedToId?: string | null;
}

export interface FindLeadsFilters {
  statuses?: LeadStatusType[];
  sectorIds?: string[];
  originIds?: string[];
  assignedToIds?: string[];
  search?: string;
  isDeleted?: boolean;
}

export interface FindPaginatedParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: FindLeadsFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}

export interface ILeadRepository {
  /**
   * Encuentra un lead por su ID
   */
  findById(id: string, tenantId: string): Promise<Lead | null>;

  /**
   * Obtiene todos los leads de un tenant
   */
  findByTenantId(
    tenantId: string,
    filters?: FindLeadsFilters
  ): Promise<Lead[]>;

  /**
   * Crea un nuevo lead
   */
  create(data: CreateLeadData): Promise<Lead>;

  /**
   * Actualiza un lead existente
   */
  update(
    id: string,
    tenantId: string,
    data: UpdateLeadData
  ): Promise<Lead | null>;

  /**
   * Actualiza el estado de un lead
   */
  updateStatus(
    id: string,
    tenantId: string,
    status: LeadStatusType,
    userId: string
  ): Promise<Lead | null>;

  /**
   * Elimina un lead (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;

  /**
   * Restaura un lead eliminado
   */
  restore(id: string, tenantId: string): Promise<boolean>;

  /**
   * Cuenta leads por tenant y filtros
   */
  count(tenantId: string, filters?: FindLeadsFilters): Promise<number>;

  /**
   * Obtiene leads paginados con filtros y ordenamiento
   */
  findPaginated(params: FindPaginatedParams): Promise<PaginatedResult<Lead>>;
}

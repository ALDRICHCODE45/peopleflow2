/**
 * Interfaz del repositorio de Leads
 * Define el contrato para la capa de infraestructura
 */

import { Lead } from "../entities/Lead";
import type { LeadStatusType } from "../value-objects/LeadStatus";

export interface CreateLeadData {
  companyName: string;
  normalizedCompanyName: string;
  website?: string | null;
  linkedInUrl?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  postalCode?: string | null;
  subOrigin?: string | null;
  employeeCount?: string | null;
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
  normalizedCompanyName?: string;
  website?: string | null;
  linkedInUrl?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  postalCode?: string | null;
  subOrigin?: string | null;
  employeeCount?: string | null;
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
  employeeCounts?: string[];
  countryCodes?: string[];
  regionCodes?: string[];
  postalCode?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  search?: string;
  isDeleted?: boolean;
}

export interface FindPaginatedParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: FindLeadsFilters;
  /** If true, only includes essential relations (assignedTo, sector, _count) for faster Kanban queries */
  minimal?: boolean;
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
  findByTenantId(tenantId: string, filters?: FindLeadsFilters): Promise<Lead[]>;

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
    data: UpdateLeadData,
  ): Promise<Lead | null>;

  /**
   * Actualiza el estado de un lead
   */
  updateStatus(
    id: string,
    tenantId: string,
    status: LeadStatusType,
    userId: string,
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

  /**
   * Reasigna un lead especifico
   * @param leadId - ID del lead a reasignar
   * @param newUserId - ID del nuevo usuario asignado
   * @param tenantId - ID del tenant para validación de aislamiento
   */
  reasignLead(
    leadId: string,
    newUserId: string,
    tenantId: string,
  ): Promise<Lead | null>;

  /**
   * Elimina múltiples leads (soft delete)
   */
  deleteMany(leadIds: string[], tenantId: string): Promise<number>;

  /**
   * Reasigna múltiples leads a un nuevo usuario
   */
  reasignMany(
    leadIds: string[],
    newUserId: string,
    tenantId: string,
  ): Promise<number>;

  /**
   * Busca un lead por nombre de empresa normalizado
   * para deteccion de duplicados
   */
  findByNormalizedCompanyName(
    normalizedName: string,
    tenantId: string,
    excludeLeadId?: string,
  ): Promise<Lead | null>;
}

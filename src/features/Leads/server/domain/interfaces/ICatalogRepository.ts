/**
 * Interfaces de repositorios para catálogos de Leads
 * Define el contrato para la capa de infraestructura
 */

export interface Sector {
  id: string;
  name: string;
  isActive: boolean;
  tenantId: string | null;
}

export interface Subsector {
  id: string;
  name: string;
  sectorId: string;
  isActive: boolean;
  tenantId: string | null;
}

export interface LeadOrigin {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tenantId: string | null;
}

export interface ISectorRepository {
  /**
   * Obtiene todos los sectores activos (globales + del tenant)
   */
  findActive(tenantId: string): Promise<Sector[]>;

  /**
   * Encuentra un sector por ID
   */
  findById(id: string): Promise<Sector | null>;
}

export interface ISubsectorRepository {
  /**
   * Obtiene todos los subsectores activos de un sector
   */
  findBySectorId(sectorId: string): Promise<Subsector[]>;

  /**
   * Encuentra un subsector por ID
   */
  findById(id: string): Promise<Subsector | null>;
}

export interface ILeadOriginRepository {
  /**
   * Obtiene todos los orígenes de leads activos (globales + del tenant)
   */
  findActive(tenantId: string): Promise<LeadOrigin[]>;

  /**
   * Encuentra un origen por ID
   */
  findById(id: string): Promise<LeadOrigin | null>;
}

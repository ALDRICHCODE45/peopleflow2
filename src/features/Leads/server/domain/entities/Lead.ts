/**
 * Entidad de dominio Lead (Aggregate Root)
 * Representa una empresa prospecto en el sistema de ventas
 */

import type { Lead as LeadDTO } from "../../../frontend/types";
import {
  LeadStatusVO,
  type LeadStatusType,
} from "../value-objects/LeadStatus";

export interface LeadProps {
  id: string;
  companyName: string;
  rfc: string | null;
  website: string | null;
  linkedInUrl: string | null;
  address: string | null;
  notes: string | null;
  status: LeadStatusType;
  sectorId: string | null;
  sectorName?: string | null;
  subsectorId: string | null;
  subsectorName?: string | null;
  originId: string | null;
  originName?: string | null;
  assignedToId: string | null;
  assignedToName?: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  contactsCount?: number;
}

export class Lead {
  private readonly props: LeadProps;
  private readonly statusVO: LeadStatusVO;

  constructor(props: LeadProps) {
    this.props = props;
    this.statusVO = LeadStatusVO.create(props.status);
  }

  // =============================================
  // GETTERS
  // =============================================

  get id(): string {
    return this.props.id;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get rfc(): string | null {
    return this.props.rfc;
  }

  get website(): string | null {
    return this.props.website;
  }

  get linkedInUrl(): string | null {
    return this.props.linkedInUrl;
  }

  get address(): string | null {
    return this.props.address;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get status(): LeadStatusType {
    return this.props.status;
  }

  get sectorId(): string | null {
    return this.props.sectorId;
  }

  get sectorName(): string | null | undefined {
    return this.props.sectorName;
  }

  get subsectorId(): string | null {
    return this.props.subsectorId;
  }

  get subsectorName(): string | null | undefined {
    return this.props.subsectorName;
  }

  get originId(): string | null {
    return this.props.originId;
  }

  get originName(): string | null | undefined {
    return this.props.originName;
  }

  get assignedToId(): string | null {
    return this.props.assignedToId;
  }

  get assignedToName(): string | null | undefined {
    return this.props.assignedToName;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
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

  get contactsCount(): number | undefined {
    return this.props.contactsCount;
  }

  // =============================================
  // MÉTODOS DE NEGOCIO
  // =============================================

  /**
   * Obtiene las transiciones de estado válidas desde el estado actual
   */
  getValidStatusTransitions(): LeadStatusType[] {
    return this.statusVO.getValidTransitions();
  }

  /**
   * Verifica si se puede transicionar al estado especificado
   */
  canTransitionTo(newStatus: LeadStatusType): boolean {
    return this.statusVO.canTransitionTo(newStatus);
  }

  /**
   * Verifica si el lead está activo (no eliminado)
   */
  isActive(): boolean {
    return !this.props.isDeleted;
  }

  /**
   * Verifica si el lead puede ser editado
   */
  canEdit(): boolean {
    return this.isActive();
  }

  /**
   * Convierte la entidad a DTO para transferencia
   */
  toJSON(): LeadDTO {
    return {
      id: this.props.id,
      companyName: this.props.companyName,
      rfc: this.props.rfc,
      website: this.props.website,
      linkedInUrl: this.props.linkedInUrl,
      address: this.props.address,
      notes: this.props.notes,
      status: this.props.status,
      sectorId: this.props.sectorId,
      sectorName: this.props.sectorName,
      subsectorId: this.props.subsectorId,
      subsectorName: this.props.subsectorName,
      originId: this.props.originId,
      originName: this.props.originName,
      assignedToId: this.props.assignedToId,
      assignedToName: this.props.assignedToName,
      isDeleted: this.props.isDeleted,
      deletedAt: this.props.deletedAt?.toISOString() ?? null,
      tenantId: this.props.tenantId,
      createdById: this.props.createdById,
      createdByName: this.props.createdByName,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      contactsCount: this.props.contactsCount,
    };
  }
}

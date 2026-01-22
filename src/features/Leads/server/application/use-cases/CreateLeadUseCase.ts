import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";

export interface CreateLeadInput {
  companyName: string;
  rfc?: string;
  website?: string;
  linkedInUrl?: string;
  address?: string;
  notes?: string;
  status?: LeadStatusType;
  sectorId?: string;
  subsectorId?: string;
  originId?: string;
  assignedToId?: string;
  tenantId: string;
  createdById: string;
}

export interface CreateLeadOutput {
  success: boolean;
  lead?: Lead;
  error?: string;
}

export class CreateLeadUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: CreateLeadInput): Promise<CreateLeadOutput> {
    try {
      const companyName = input.companyName?.trim() || "";

      // Validación de longitud mínima
      if (companyName.length < 2) {
        return {
          success: false,
          error: "El nombre de la empresa debe tener al menos 2 caracteres",
        };
      }

      // Validación de longitud máxima
      if (companyName.length > 200) {
        return {
          success: false,
          error: "El nombre de la empresa no puede exceder 200 caracteres",
        };
      }

      // Validación de RFC si se proporciona
      if (input.rfc && input.rfc.length > 13) {
        return {
          success: false,
          error: "El RFC no puede exceder 13 caracteres",
        };
      }

      // Validación de URL de website
      if (input.website && input.website.length > 500) {
        return {
          success: false,
          error: "La URL del sitio web no puede exceder 500 caracteres",
        };
      }

      // Validación de URL de LinkedIn
      if (input.linkedInUrl && input.linkedInUrl.length > 500) {
        return {
          success: false,
          error: "La URL de LinkedIn no puede exceder 500 caracteres",
        };
      }

      const lead = await this.leadRepository.create({
        companyName,
        rfc: input.rfc?.trim() || null,
        website: input.website?.trim() || null,
        linkedInUrl: input.linkedInUrl?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status || "CONTACTO_CALIDO",
        sectorId: input.sectorId || null,
        subsectorId: input.subsectorId || null,
        originId: input.originId || null,
        assignedToId: input.assignedToId || null,
        tenantId: input.tenantId,
        createdById: input.createdById,
      });

      return {
        success: true,
        lead,
      };
    } catch (error) {
      console.error("Error in CreateLeadUseCase:", error);
      return {
        success: false,
        error: "Error al crear lead",
      };
    }
  }
}

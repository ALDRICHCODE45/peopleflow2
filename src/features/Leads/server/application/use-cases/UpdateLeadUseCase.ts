import type { ILeadRepository, UpdateLeadData } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";

export interface UpdateLeadInput {
  leadId: string;
  tenantId: string;
  data: {
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
  };
}

export interface UpdateLeadOutput {
  success: boolean;
  lead?: Lead;
  error?: string;
}

export class UpdateLeadUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: UpdateLeadInput): Promise<UpdateLeadOutput> {
    try {
      // Verificar que el lead existe
      const existingLead = await this.leadRepository.findById(
        input.leadId,
        input.tenantId
      );

      if (!existingLead) {
        return {
          success: false,
          error: "Lead no encontrado",
        };
      }

      if (!existingLead.canEdit()) {
        return {
          success: false,
          error: "El lead no puede ser editado",
        };
      }

      // Validaciones
      if (input.data.companyName !== undefined) {
        const companyName = input.data.companyName.trim();
        if (companyName.length < 2) {
          return {
            success: false,
            error: "El nombre de la empresa debe tener al menos 2 caracteres",
          };
        }
        if (companyName.length > 200) {
          return {
            success: false,
            error: "El nombre de la empresa no puede exceder 200 caracteres",
          };
        }
      }

      if (input.data.rfc !== undefined && input.data.rfc !== null) {
        if (input.data.rfc.length > 13) {
          return {
            success: false,
            error: "El RFC no puede exceder 13 caracteres",
          };
        }
      }

      const updateData: UpdateLeadData = {};

      if (input.data.companyName !== undefined) {
        updateData.companyName = input.data.companyName.trim();
      }
      if (input.data.rfc !== undefined) {
        updateData.rfc = input.data.rfc?.trim() || null;
      }
      if (input.data.website !== undefined) {
        updateData.website = input.data.website?.trim() || null;
      }
      if (input.data.linkedInUrl !== undefined) {
        updateData.linkedInUrl = input.data.linkedInUrl?.trim() || null;
      }
      if (input.data.address !== undefined) {
        updateData.address = input.data.address?.trim() || null;
      }
      if (input.data.notes !== undefined) {
        updateData.notes = input.data.notes?.trim() || null;
      }
      if (input.data.sectorId !== undefined) {
        updateData.sectorId = input.data.sectorId;
      }
      if (input.data.subsectorId !== undefined) {
        updateData.subsectorId = input.data.subsectorId;
      }
      if (input.data.originId !== undefined) {
        updateData.originId = input.data.originId;
      }
      if (input.data.assignedToId !== undefined) {
        updateData.assignedToId = input.data.assignedToId;
      }

      const lead = await this.leadRepository.update(
        input.leadId,
        input.tenantId,
        updateData
      );

      if (!lead) {
        return {
          success: false,
          error: "Error al actualizar lead",
        };
      }

      return {
        success: true,
        lead,
      };
    } catch (error) {
      console.error("Error in UpdateLeadUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar lead",
      };
    }
  }
}

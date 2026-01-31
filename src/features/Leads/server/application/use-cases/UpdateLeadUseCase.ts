import type { ILeadRepository, UpdateLeadData } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";
import { CompanyNameVO, URLVO } from "../../domain/value-objects";

export interface UpdateLeadInput {
  leadId: string;
  tenantId: string;
  data: {
    companyName?: string;
    website?: string | null;
    linkedInUrl?: string | null;
    address?: string | null;
    subOrigin?: string | null;
    employeeCount?: string | null;
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

      const updateData: UpdateLeadData = {};

      // Validar y procesar companyName si se proporciona
      if (input.data.companyName !== undefined) {
        const companyName = CompanyNameVO.create(input.data.companyName);
        updateData.companyName = companyName.getValue();
      }

      // Validar y procesar website si se proporciona
      if (input.data.website !== undefined) {
        const website = URLVO.create(input.data.website);
        updateData.website = website.getValue();
      }

      // Validar y procesar linkedInUrl si se proporciona
      if (input.data.linkedInUrl !== undefined) {
        const linkedInUrl = URLVO.create(input.data.linkedInUrl);
        updateData.linkedInUrl = linkedInUrl.getValue();
      }

      if (input.data.address !== undefined) {
        updateData.address = input.data.address?.trim() || null;
      }
      if (input.data.subOrigin !== undefined) {
        updateData.subOrigin = input.data.subOrigin?.trim() || null;
      }
      if (input.data.employeeCount !== undefined) {
        updateData.employeeCount = input.data.employeeCount?.trim() || null;
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
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al actualizar lead",
      };
    }
  }
}

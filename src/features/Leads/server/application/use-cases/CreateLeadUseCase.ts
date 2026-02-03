import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import { CompanyNameVO, URLVO } from "../../domain/value-objects";
import { CompanyNameNormalizationService } from "../../domain/services/CompanyNameNormalizationService";

export interface CreateLeadInput {
  companyName: string;
  website?: string;
  linkedInUrl?: string;
  address?: string;
  subOrigin?: string;
  employeeCount?: string;
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
      // Validaciones encapsuladas en Value Objects
      const companyName = CompanyNameVO.create(input.companyName);
      const website = URLVO.create(input.website);
      const linkedInUrl = URLVO.create(input.linkedInUrl);

      // Deteccion de duplicados por nombre normalizado
      const normalizedCompanyName = CompanyNameNormalizationService.normalize(
        companyName.getValue(),
      );
      const existingLead =
        await this.leadRepository.findByNormalizedCompanyName(
          normalizedCompanyName,
          input.tenantId,
        );
      if (existingLead) {
        return {
          success: false,
          error: `Ya existe un lead con un nombre similar: "${existingLead.companyName}"`,
        };
      }

      const lead = await this.leadRepository.create({
        companyName: companyName.getValue(),
        normalizedCompanyName,
        website: website.getValue(),
        linkedInUrl: linkedInUrl.getValue(),
        address: input.address?.trim() || null,
        subOrigin: input.subOrigin?.trim() || null,
        employeeCount: input.employeeCount?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status || "CONTACTO",
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
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al crear lead",
      };
    }
  }
}

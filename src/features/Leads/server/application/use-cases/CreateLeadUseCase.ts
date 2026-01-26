import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import { CompanyNameVO, RFCVO, URLVO } from "../../domain/value-objects";

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
      // Validaciones encapsuladas en Value Objects
      const companyName = CompanyNameVO.create(input.companyName);
      const rfc = RFCVO.create(input.rfc);
      const website = URLVO.create(input.website);
      const linkedInUrl = URLVO.create(input.linkedInUrl);

      const lead = await this.leadRepository.create({
        companyName: companyName.getValue(),
        rfc: rfc.getValue(),
        website: website.getValue(),
        linkedInUrl: linkedInUrl.getValue(),
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

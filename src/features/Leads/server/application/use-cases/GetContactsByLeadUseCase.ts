import type { IContactRepository } from "../../domain/interfaces/IContactRepository";
import { Contact } from "../../domain/entities/Contact";

export interface GetContactsByLeadInput {
  leadId: string;
  tenantId: string;
}

export interface GetContactsByLeadOutput {
  success: boolean;
  contacts?: Contact[];
  error?: string;
}

export class GetContactsByLeadUseCase {
  constructor(private readonly contactRepository: IContactRepository) {}

  async execute(input: GetContactsByLeadInput): Promise<GetContactsByLeadOutput> {
    try {
      const contacts = await this.contactRepository.findByLeadId(
        input.leadId,
        input.tenantId
      );

      return {
        success: true,
        contacts,
      };
    } catch (error) {
      console.error("Error in GetContactsByLeadUseCase:", error);
      return {
        success: false,
        error: "Error al obtener contactos",
      };
    }
  }
}

import type { IClientRepository } from "../../domain/interfaces/IClientRepository";
import { Client } from "../../domain/entities/Client";

export interface GetClientByIdInput {
  clientId: string;
  tenantId: string;
}

export interface GetClientByIdOutput {
  success: boolean;
  client?: Client;
  error?: string;
}

export class GetClientByIdUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: GetClientByIdInput): Promise<GetClientByIdOutput> {
    try {
      const client = await this.clientRepository.findByIdWithTenant(
        input.clientId,
        input.tenantId,
      );

      if (!client) {
        return {
          success: false,
          error: "Cliente no encontrado",
        };
      }

      return {
        success: true,
        client,
      };
    } catch (error) {
      console.error("Error in GetClientByIdUseCase:", error);
      return {
        success: false,
        error: "Error al obtener el cliente",
      };
    }
  }
}

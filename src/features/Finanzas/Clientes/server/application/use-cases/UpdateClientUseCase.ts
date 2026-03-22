import type {
  IClientRepository,
  UpdateClientData,
} from "../../domain/interfaces/IClientRepository";
import type { ClientDTO } from "../../../frontend/types/client.types";

export interface UpdateClientInput {
  clientId: string;
  tenantId: string;
  data: UpdateClientData;
}

export interface UpdateClientOutput {
  success: boolean;
  data?: ClientDTO;
  error?: string;
}

export class UpdateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: UpdateClientInput): Promise<UpdateClientOutput> {
    try {
      const client = await this.clientRepository.update(
        input.clientId,
        input.data,
        input.tenantId,
      );

      return {
        success: true,
        data: client.toJSON(),
      };
    } catch (error) {
      console.error("Error in UpdateClientUseCase:", error);

      if (
        error instanceof Error &&
        error.message.includes("not found")
      ) {
        return {
          success: false,
          error: "Cliente no encontrado",
        };
      }

      return {
        success: false,
        error: "Error al actualizar el cliente",
      };
    }
  }
}

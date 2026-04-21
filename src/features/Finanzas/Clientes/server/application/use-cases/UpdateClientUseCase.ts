import { CompanyNameNormalizationService } from "@core/shared/services/CompanyNameNormalizationService";
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
      // Preparar los datos de actualización
      const updateData: UpdateClientData = { ...input.data };

      // Si se está actualizando el nombre, validar duplicados
      if (input.data.nombre !== undefined) {
        const nombreTrimmed = input.data.nombre.trim();
        if (!nombreTrimmed) {
          return {
            success: false,
            error: "El nombre del cliente no puede estar vacío",
          };
        }

        // Normalizar y verificar duplicados excluyendo el cliente actual
        const normalizedNombre = CompanyNameNormalizationService.normalize(nombreTrimmed);
        const existingClient = await this.clientRepository.findByNormalizedNombre(
          normalizedNombre,
          input.tenantId,
          input.clientId,
        );

        if (existingClient) {
          return {
            success: false,
            error: `Ya existe un cliente con un nombre similar: "${existingClient.nombre}"`,
          };
        }

        updateData.nombre = nombreTrimmed;
        updateData.normalizedNombre = normalizedNombre;
      }

      const client = await this.clientRepository.update(
        input.clientId,
        updateData,
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

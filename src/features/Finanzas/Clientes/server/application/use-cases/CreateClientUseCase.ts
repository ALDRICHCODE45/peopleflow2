import { CompanyNameNormalizationService } from "@core/shared/services/CompanyNameNormalizationService";
import type {
  IClientRepository,
  CommercialTermsData,
} from "../../domain/interfaces/IClientRepository";
import type { ClientDTO } from "../../../frontend/types/client.types";

export interface CreateClientInput {
  nombre: string;
  leadId: string | null;
  generadorId: string | null;
  origenId: string | null;
  tenantId: string;
  createdById: string | null;
  commercialTerms?: CommercialTermsData;
}

export interface CreateClientOutput {
  success: boolean;
  data?: ClientDTO;
  error?: string;
}

export class CreateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    try {
      // Validar nombre
      const nombreTrimmed = input.nombre.trim();
      if (!nombreTrimmed) {
        return {
          success: false,
          error: "El nombre del cliente es requerido",
        };
      }

      // Normalizar nombre y verificar duplicados
      const normalizedNombre = CompanyNameNormalizationService.normalize(nombreTrimmed);
      const existingClient = await this.clientRepository.findByNormalizedNombre(
        normalizedNombre,
        input.tenantId,
      );

      if (existingClient) {
        return {
          success: false,
          error: `Ya existe un cliente con un nombre similar: "${existingClient.nombre}"`,
        };
      }

      // Crear cliente con nombre normalizado
      const client = await this.clientRepository.create({
        nombre: nombreTrimmed,
        normalizedNombre,
        leadId: input.leadId,
        generadorId: input.generadorId,
        origenId: input.origenId,
        tenantId: input.tenantId,
        createdById: input.createdById,
        commercialTerms: input.commercialTerms,
      });

      return {
        success: true,
        data: client.toJSON(),
      };
    } catch (error) {
      console.error("Error in CreateClientUseCase:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al crear el cliente",
      };
    }
  }
}

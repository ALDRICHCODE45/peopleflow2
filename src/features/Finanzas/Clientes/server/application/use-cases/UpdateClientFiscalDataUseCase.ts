import { RFCVO } from "@features/Leads/server/domain/value-objects/RFC";
import type {
  IClientRepository,
  FiscalData,
} from "../../domain/interfaces/IClientRepository";
import type { ClientDTO } from "../../../frontend/types/client.types";

export interface UpdateFiscalDataInput {
  clientId: string;
  tenantId: string;
  fiscalData: FiscalData;
}

export interface UpdateFiscalDataOutput {
  success: boolean;
  data?: ClientDTO;
  error?: string;
}

export class UpdateClientFiscalDataUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: UpdateFiscalDataInput): Promise<UpdateFiscalDataOutput> {
    try {
      // Validar RFC si se proporcionó
      if (input.fiscalData.rfc !== undefined && input.fiscalData.rfc !== null) {
        try {
          const rfcVO = RFCVO.create(input.fiscalData.rfc);
          input.fiscalData.rfc = rfcVO.getValue();
        } catch (error) {
          if (error instanceof Error) {
            return { success: false, error: error.message };
          }
          return { success: false, error: "RFC inválido" };
        }
      }

      // Validar código postal fiscal (5 dígitos)
      if (
        input.fiscalData.codigoPostalFiscal !== undefined &&
        input.fiscalData.codigoPostalFiscal !== null &&
        input.fiscalData.codigoPostalFiscal.trim() !== ""
      ) {
        const cp = input.fiscalData.codigoPostalFiscal.trim();
        if (!/^\d{5}$/.test(cp)) {
          return {
            success: false,
            error: "El código postal fiscal debe ser de 5 dígitos",
          };
        }
        input.fiscalData.codigoPostalFiscal = cp;
      }

      const client = await this.clientRepository.update(
        input.clientId,
        { fiscalData: input.fiscalData },
        input.tenantId,
      );

      return {
        success: true,
        data: client.toJSON(),
      };
    } catch (error) {
      console.error("Error in UpdateClientFiscalDataUseCase:", error);

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
        error: "Error al actualizar los datos fiscales",
      };
    }
  }
}

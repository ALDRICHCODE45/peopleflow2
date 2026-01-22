import type {
  ISectorRepository,
  Sector,
} from "../../domain/interfaces/ICatalogRepository";

export interface GetSectorsInput {
  tenantId: string;
}

export interface GetSectorsOutput {
  success: boolean;
  sectors?: Sector[];
  error?: string;
}

export class GetSectorsUseCase {
  constructor(private readonly sectorRepository: ISectorRepository) {}

  async execute(input: GetSectorsInput): Promise<GetSectorsOutput> {
    try {
      const sectors = await this.sectorRepository.findActive(input.tenantId);

      return {
        success: true,
        sectors,
      };
    } catch (error) {
      console.error("Error in GetSectorsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener sectores",
      };
    }
  }
}

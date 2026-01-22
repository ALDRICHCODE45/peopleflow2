import type {
  ISubsectorRepository,
  Subsector,
} from "../../domain/interfaces/ICatalogRepository";

export interface GetSubsectorsBySectorInput {
  sectorId: string;
}

export interface GetSubsectorsBySectorOutput {
  success: boolean;
  subsectors?: Subsector[];
  error?: string;
}

export class GetSubsectorsBySectorUseCase {
  constructor(private readonly subsectorRepository: ISubsectorRepository) {}

  async execute(input: GetSubsectorsBySectorInput): Promise<GetSubsectorsBySectorOutput> {
    try {
      const subsectors = await this.subsectorRepository.findBySectorId(
        input.sectorId
      );

      return {
        success: true,
        subsectors,
      };
    } catch (error) {
      console.error("Error in GetSubsectorsBySectorUseCase:", error);
      return {
        success: false,
        error: "Error al obtener subsectores",
      };
    }
  }
}

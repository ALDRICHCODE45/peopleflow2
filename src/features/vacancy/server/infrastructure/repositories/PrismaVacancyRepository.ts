import prisma from "@lib/prisma";
import { Vacancy, VacancyStatus } from "../../domain/entities/Vacancy";
import {
  IVacancyRepository,
  CreateVacancyData,
  UpdateVacancyData,
  FindVacanciesFilters,
  FindPaginatedParams,
  PaginatedResult,
} from "../../domain/interfaces/IVacancyRepository";

/**
 * Implementación del repositorio de Vacancies usando Prisma
 * Capa de infraestructura - acceso a datos
 *
 * NOTA: Este repositorio usa el cliente prisma base con filtrado manual de tenantId
 * para defense-in-depth. El prisma-tenant.ts proporciona una capa adicional de seguridad.
 */

export class PrismaVacancyRepository implements IVacancyRepository {
  private mapToDomain(vacancy: {
    id: string;
    title: string;
    description: string;
    status: VacancyStatus;
    department: string | null;
    location: string | null;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Vacancy {
    return new Vacancy({
      id: vacancy.id,
      title: vacancy.title,
      description: vacancy.description,
      status: vacancy.status as VacancyStatus,
      department: vacancy.department,
      location: vacancy.location,
      tenantId: vacancy.tenantId,
      createdAt: vacancy.createdAt,
      updatedAt: vacancy.updatedAt,
    });
  }

  async findById(id: string, tenantId: string): Promise<Vacancy | null> {
    const vacancy = await prisma.vacancy.findFirst({
      where: { id, tenantId },
    });

    if (!vacancy) return null;

    return this.mapToDomain(vacancy);
  }

  async findByTenantId(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<Vacancy[]> {
    const where = this.buildWhereClause(tenantId, filters);

    const vacancies = await prisma.vacancy.findMany({
      where,
      select: this.getListingSelect(),
      orderBy: { createdAt: "desc" },
    });

    return vacancies.map((v) => this.mapToDomain({ ...v, description: "" }));
  }

  async create(data: CreateVacancyData): Promise<Vacancy> {
    const vacancy = await prisma.vacancy.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "DRAFT",
        department: data.department || null,
        location: data.location || null,
        tenantId: data.tenantId,
      },
    });

    return this.mapToDomain(vacancy);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateVacancyData
  ): Promise<Vacancy | null> {
    try {
      // Operacion atomica: verifica tenantId y actualiza en una sola query
      // Evita race conditions (TOCTOU vulnerability)
      const result = await prisma.vacancy.updateMany({
        where: { id, tenantId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.location !== undefined && { location: data.location }),
        },
      });

      // Si no se actualizo ninguna fila, la vacante no existe o no pertenece al tenant
      if (result.count === 0) {
        return null;
      }

      // Recuperar la vacante actualizada
      const vacancy = await prisma.vacancy.findFirst({
        where: { id, tenantId },
      });

      if (!vacancy) {
        return null;
      }

      return this.mapToDomain(vacancy) as Vacancy;
    } catch (error) {
      console.error("Error updating vacancy:", error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      // Operacion atomica: verifica tenantId y elimina en una sola query
      // Evita race conditions (TOCTOU vulnerability)
      const result = await prisma.vacancy.deleteMany({
        where: { id, tenantId },
      });

      // Si no se elimino ninguna fila, la vacante no existe o no pertenece al tenant
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      return false;
    }
  }

  async count(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<number> {
    const where = this.buildWhereClause(tenantId, filters);
    return prisma.vacancy.count({ where });
  }

  async findPaginated(
    params: FindPaginatedParams
  ): Promise<PaginatedResult<Vacancy>> {
    const { tenantId, skip, take, sorting, filters } = params;
    const where = this.buildWhereClause(tenantId, filters);

    // Construir orderBy dinámico basado en sorting
    // Whitelist de columnas permitidas para prevenir inyección
    const allowedSortColumns = [
      "title",
      "status",
      "department",
      "location",
      "createdAt",
      "updatedAt",
    ];

    const orderBy =
      sorting && sorting.length > 0
        ? sorting
            .filter((s) => allowedSortColumns.includes(s.id))
            .map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" as const }];

    // Ejecutar count y findMany en paralelo para mejor performance
    // Excluir description (campo @db.Text potencialmente largo) en listados
    const [totalCount, vacancies] = await Promise.all([
      prisma.vacancy.count({ where }),
      prisma.vacancy.findMany({
        where,
        select: this.getListingSelect(),
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      data: vacancies.map((v) => this.mapToDomain({ ...v, description: "" })),
      totalCount,
    };
  }

  /**
   * Select para listados: excluye description (campo @db.Text largo)
   */
  private getListingSelect() {
    return {
      id: true,
      title: true,
      status: true,
      department: true,
      location: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  /**
   * Construye la cláusula where para las queries de vacantes
   */
  private buildWhereClause(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.department) {
      where.department = filters.department;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}

// Singleton instance
export const prismaVacancyRepository = new PrismaVacancyRepository();

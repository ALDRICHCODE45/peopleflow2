import prisma from "@lib/prisma";
import type { Prisma } from "@/core/generated/prisma/client";
import type {
  IVacancyCommitmentRepository,
  CreateCommitmentData,
  UpdateCommitmentData,
  UpdateCommitmentStatusData,
  AppendCommitmentEventData,
  VacancyCommitmentEvent,
  CommitmentReportRow,
} from "../../domain/interfaces/IVacancyCommitmentRepository";
import { VacancyCommitment } from "../../domain/entities/VacancyCommitment";
import type { VacancyCommitmentEventDTO } from "@features/vacancy/frontend/types/vacancy.types";

type CommitmentWithEvents = Prisma.VacancyCommitmentGetPayload<{
  include: {
    responsibleUser: {
      select: { name: true };
    };
    events: {
      include: {
        changedBy: {
          select: { name: true };
        };
      };
    };
  };
}>;

export class PrismaVacancyCommitmentRepository
  implements IVacancyCommitmentRepository
{
  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCommitment[]> {
    const records = await prisma.vacancyCommitment.findMany({
      where: { vacancyId, tenantId },
      include: {
        responsibleUser: {
          select: { name: true },
        },
        events: {
          include: {
            changedBy: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async findById(
    id: string,
    tenantId: string
  ): Promise<VacancyCommitment | null> {
    const record = await prisma.vacancyCommitment.findFirst({
      where: { id, tenantId },
      include: {
        responsibleUser: {
          select: { name: true },
        },
        events: {
          include: {
            changedBy: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!record) return null;
    return this.mapToEntity(record);
  }

  async create(data: CreateCommitmentData): Promise<VacancyCommitment> {
    const record = await prisma.vacancyCommitment.create({
      data: {
        vacancyId: data.vacancyId,
        tenantId: data.tenantId,
        description: data.description,
        dueDate: data.dueDate,
        responsibleUserId: data.responsibleUserId,
        createdById: data.createdById,
        status: "PENDING",
      },
      include: {
        responsibleUser: {
          select: { name: true },
        },
      },
    });

    return this.mapToEntity(record);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateCommitmentData
  ): Promise<VacancyCommitment> {
    const record = await prisma.vacancyCommitment.update({
      where: { id, tenantId },
      data: {
        description: data.description ?? undefined,
        dueDate: data.dueDate ?? undefined,
      },
      include: {
        responsibleUser: {
          select: { name: true },
        },
      },
    });

    return this.mapToEntity(record);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    data: UpdateCommitmentStatusData
  ): Promise<VacancyCommitment> {
    const record = await prisma.vacancyCommitment.update({
      where: { id, tenantId },
      data: {
        status: data.status,
        completedAt: data.completedAt ?? undefined,
        completedById: data.completedById ?? undefined,
        cancelledAt: data.cancelledAt ?? undefined,
        cancelledById: data.cancelledById ?? undefined,
        cancelReason: data.cancelReason ?? undefined,
      },
    });

    return this.mapToEntity(record);
  }

  async appendEvent(
    data: AppendCommitmentEventData
  ): Promise<VacancyCommitmentEvent> {
    const event = await prisma.vacancyCommitmentEvent.create({
      data: {
        commitmentId: data.commitmentId,
        tenantId: data.tenantId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        note: data.note ?? null,
        changedById: data.changedById,
      },
      include: {
        changedBy: {
          select: { name: true },
        },
      },
    });

    return {
      id: event.id,
      commitmentId: event.commitmentId,
      tenantId: event.tenantId,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      note: event.note,
      changedById: event.changedById,
      changedByName: event.changedBy?.name ?? null,
      createdAt: event.createdAt,
    };
  }

  async getHistory(
    commitmentId: string,
    tenantId: string
  ): Promise<VacancyCommitmentEvent[]> {
    const events = await prisma.vacancyCommitmentEvent.findMany({
      where: { commitmentId, tenantId },
      include: {
        changedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return events.map((e) => ({
      id: e.id,
      commitmentId: e.commitmentId,
      tenantId: e.tenantId,
      previousStatus: e.previousStatus,
      newStatus: e.newStatus,
      note: e.note,
      changedById: e.changedById,
      changedByName: e.changedBy?.name ?? null,
      createdAt: e.createdAt,
    }));
  }

  async findDueToday(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<CommitmentReportRow[]> {
    const commitments = await prisma.vacancyCommitment.findMany({
      where: {
        tenantId,
        status: "PENDING",
        dueDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        vacancy: {
          select: {
            position: true,
            client: {
              select: { nombre: true },
            },
          },
        },
        responsibleUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    });

    return commitments.map((c) => ({
      commitmentId: c.id,
      vacancyId: c.vacancyId,
      vacancyPosition: c.vacancy.position,
      clientName: c.vacancy.client.nombre,
      recruiterId: c.responsibleUser.id,
      recruiterName: c.responsibleUser.name,
      recruiterEmail: c.responsibleUser.email,
      description: c.description,
      dueDate: c.dueDate,
      status: c.status,
      createdAt: c.createdAt,
      completedAt: c.completedAt,
    }));
  }

  async findByCreatedInRange(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<CommitmentReportRow[]> {
    const commitments = await prisma.vacancyCommitment.findMany({
      where: {
        tenantId,
        status: "PENDING",
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        vacancy: {
          select: {
            position: true,
            client: {
              select: { nombre: true },
            },
          },
        },
        responsibleUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    });

    return commitments.map((c) => ({
      commitmentId: c.id,
      vacancyId: c.vacancyId,
      vacancyPosition: c.vacancy.position,
      clientName: c.vacancy.client.nombre,
      recruiterId: c.responsibleUser.id,
      recruiterName: c.responsibleUser.name,
      recruiterEmail: c.responsibleUser.email,
      description: c.description,
      dueDate: c.dueDate,
      status: c.status,
      createdAt: c.createdAt,
      completedAt: c.completedAt,
    }));
  }

  async findPendingForAdminReport(
    tenantId: string
  ): Promise<CommitmentReportRow[]> {
    const commitments = await prisma.vacancyCommitment.findMany({
      where: {
        tenantId,
        status: "PENDING",
      },
      include: {
        vacancy: {
          select: {
            position: true,
            client: {
              select: { nombre: true },
            },
          },
        },
        responsibleUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    });

    return commitments.map((c) => ({
      commitmentId: c.id,
      vacancyId: c.vacancyId,
      vacancyPosition: c.vacancy.position,
      clientName: c.vacancy.client.nombre,
      recruiterId: c.responsibleUser.id,
      recruiterName: c.responsibleUser.name,
      recruiterEmail: c.responsibleUser.email,
      description: c.description,
      dueDate: c.dueDate,
      status: c.status,
      createdAt: c.createdAt,
      completedAt: c.completedAt,
    }));
  }

  private mapToEntity(
    record: CommitmentWithEvents | Prisma.VacancyCommitmentGetPayload<object>
  ): VacancyCommitment {
    const events: VacancyCommitmentEventDTO[] | undefined = "events" in record && record.events
      ? record.events.map((e) => ({
          id: e.id,
          commitmentId: e.commitmentId,
          previousStatus: e.previousStatus,
          newStatus: e.newStatus,
          note: e.note,
          changedById: e.changedById,
          changedByName: e.changedBy?.name ?? null,
          createdAt: e.createdAt.toISOString(),
        }))
      : undefined;

    const responsibleUserName = "responsibleUser" in record && record.responsibleUser
      ? record.responsibleUser.name
      : null;

    return new VacancyCommitment({
      id: record.id,
      vacancyId: record.vacancyId,
      tenantId: record.tenantId,
      description: record.description,
      dueDate: record.dueDate,
      status: record.status,
      responsibleUserId: record.responsibleUserId,
      responsibleUserName,
      cancelledAt: record.cancelledAt,
      cancelledById: record.cancelledById,
      cancelReason: record.cancelReason,
      completedAt: record.completedAt,
      completedById: record.completedById,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      events,
    });
  }
}

export const prismaVacancyCommitmentRepository =
  new PrismaVacancyCommitmentRepository();

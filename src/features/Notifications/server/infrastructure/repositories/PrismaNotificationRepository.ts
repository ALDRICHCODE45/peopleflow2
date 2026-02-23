import prisma from "@lib/prisma";
import { Prisma } from "@/core/generated/prisma/client";
import type {
  CreateNotificationData,
  INotificationRepository,
} from "../../domain/interfaces/INotificationRepository";
import {
  Notification,
  type NotificationProvider,
  type NotificationPriority,
  type NotificationStatus,
} from "../../domain/entities/Notification";

type PrismaNotificationRecord = {
  id: string;
  tenantId: string;
  provider: string;
  status: string;
  priority: string;
  recipient: string;
  subject: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaNotificationRepository implements INotificationRepository {
  private mapToDomain(record: PrismaNotificationRecord): Notification {
    return new Notification({
      id: record.id,
      tenantId: record.tenantId,
      provider: record.provider as NotificationProvider,
      status: record.status as NotificationStatus,
      priority: record.priority as NotificationPriority,
      recipient: record.recipient,
      subject: record.subject,
      body: record.body,
      metadata: record.metadata,
      sentAt: record.sentAt,
      failedAt: record.failedAt,
      error: record.error,
      retryCount: record.retryCount,
      maxRetries: record.maxRetries,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const record = await prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        provider: data.provider,
        recipient: data.recipient,
        subject: data.subject || null,
        body: data.body,
        metadata: data.metadata as Prisma.InputJsonValue ?? undefined,
        priority: data.priority || "MEDIUM",
        status: data.status || "PENDING",
        createdById: data.createdById || null,
      },
    });
    return this.mapToDomain(
      record as unknown as PrismaNotificationRecord
    );
  }

  async findById(id: string, tenantId: string): Promise<Notification | null> {
    const record = await prisma.notification.findUnique({
      where: { id },
    });

    if (!record || record.tenantId !== tenantId) {
      return null;
    }

    return this.mapToDomain(
      record as unknown as PrismaNotificationRecord
    );
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string
  ): Promise<Notification | null> {
    const updateData: Record<string, unknown> = { status };

    if (status === "SENT") {
      updateData.sentAt = new Date();
    }

    if (status === "FAILED") {
      updateData.failedAt = new Date();
      updateData.error = error || null;
      updateData.retryCount = { increment: 1 };
    }

    try {
      const record = await prisma.notification.update({
        where: { id },
        data: updateData,
      });
      return this.mapToDomain(
        record as unknown as PrismaNotificationRecord
      );
    } catch {
      return null;
    }
  }

  async findPending(tenantId?: string): Promise<Notification[]> {
    const where: Record<string, unknown> = { status: "PENDING" };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const records = await prisma.notification.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return records.map((record) =>
      this.mapToDomain(record as unknown as PrismaNotificationRecord)
    );
  }

  async findByTenant(
    tenantId: string,
    options?: {
      status?: NotificationStatus;
      provider?: NotificationProvider;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    const where: Record<string, unknown> = { tenantId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.provider) {
      where.provider = options.provider;
    }

    const records = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((record) =>
      this.mapToDomain(record as unknown as PrismaNotificationRecord)
    );
  }
}

export const prismaNotificationRepository = new PrismaNotificationRepository();

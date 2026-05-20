import prisma from "@lib/prisma";
import { Prisma } from "@/core/generated/prisma/client";
import type {
  CreateInAppNotificationData,
  IInAppNotificationRepository,
  ListInAppNotificationsInput,
  ListInAppNotificationsOutput,
} from "../../domain/interfaces/IInAppNotificationRepository";
import {
  InAppNotification,
  type InAppNotificationType,
} from "../../domain/entities/InAppNotification";

type PrismaInAppNotificationRecord = {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  triggeredByUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export class PrismaInAppNotificationRepository
  implements IInAppNotificationRepository
{
  private mapToDomain(record: PrismaInAppNotificationRecord): InAppNotification {
    return new InAppNotification({
      id: record.id,
      tenantId: record.tenantId,
      userId: record.userId,
      type: record.type as InAppNotificationType,
      title: record.title,
      body: record.body,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      actionUrl: record.actionUrl,
      readAt: record.readAt,
      archivedAt: record.archivedAt,
      triggeredByUserId: record.triggeredByUserId,
      metadata: record.metadata,
      createdAt: record.createdAt,
    });
  }

  async create(data: CreateInAppNotificationData): Promise<InAppNotification> {
    const record = await prisma.inAppNotification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        actionUrl: data.actionUrl,
        triggeredByUserId: data.triggeredByUserId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return this.mapToDomain(record as PrismaInAppNotificationRecord);
  }

  async createMany(data: CreateInAppNotificationData[]): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    const result = await prisma.inAppNotification.createMany({
      data: data.map((item) => ({
        tenantId: item.tenantId,
        userId: item.userId,
        type: item.type,
        title: item.title,
        body: item.body,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        actionUrl: item.actionUrl,
        triggeredByUserId: item.triggeredByUserId,
        metadata: item.metadata as Prisma.InputJsonValue | undefined,
      })),
    });

    return result.count;
  }

  async listForUser(
    input: ListInAppNotificationsInput
  ): Promise<ListInAppNotificationsOutput> {
    const records = await prisma.inAppNotification.findMany({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        archivedAt: null,
        ...(input.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > input.limit;
    const items = hasMore ? records.slice(0, input.limit) : records;

    return {
      items: items.map((record) =>
        this.mapToDomain(record as PrismaInAppNotificationRecord)
      ),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async getUnreadCount(input: { tenantId: string; userId: string }): Promise<number> {
    return prisma.inAppNotification.count({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        readAt: null,
        archivedAt: null,
      },
    });
  }

  async markAsRead(input: {
    id: string;
    tenantId: string;
    userId: string;
  }): Promise<void> {
    await prisma.inAppNotification.updateMany({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        userId: input.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(input: { tenantId: string; userId: string }): Promise<number> {
    const result = await prisma.inAppNotification.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        readAt: null,
        archivedAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  }
}

export const prismaInAppNotificationRepository =
  new PrismaInAppNotificationRepository();

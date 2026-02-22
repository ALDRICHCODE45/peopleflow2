import prisma from "@lib/prisma";
import type {
  INotificationConfigRepository,
  UpsertNotificationConfigData,
} from "../../domain/interfaces/INotificationConfigRepository";
import {
  NotificationConfig,
  type NotificationConfigProps,
} from "../../domain/entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";

export class PrismaNotificationConfigRepository
  implements INotificationConfigRepository
{
  private mapToDomain(
    record: {
      id: string;
      tenantId: string;
      enabled: boolean;
      recipientUserIds: string[];
      leadStatusChangeEnabled: boolean;
      leadStatusChangeTriggers: string[];
      leadInactiveEnabled: boolean;
      leadInactiveStatuses: string[];
      leadInactiveTimeValue: number;
      leadInactiveTimeUnit: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): NotificationConfig {
    return new NotificationConfig({
      id: record.id,
      tenantId: record.tenantId,
      enabled: record.enabled,
      recipientUserIds: record.recipientUserIds,
      leadStatusChangeEnabled: record.leadStatusChangeEnabled,
      leadStatusChangeTriggers: record.leadStatusChangeTriggers as LeadStatus[],
      leadInactiveEnabled: record.leadInactiveEnabled,
      leadInactiveStatuses: record.leadInactiveStatuses as LeadStatus[],
      leadInactiveTimeValue: record.leadInactiveTimeValue,
      leadInactiveTimeUnit: record.leadInactiveTimeUnit as NotificationConfigProps["leadInactiveTimeUnit"],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async findByTenantId(tenantId: string): Promise<NotificationConfig | null> {
    const record = await prisma.notificationConfig.findUnique({
      where: { tenantId },
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  async upsert(data: UpsertNotificationConfigData): Promise<NotificationConfig> {
    const record = await prisma.notificationConfig.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        enabled: data.enabled,
        recipientUserIds: data.recipientUserIds,
        leadStatusChangeEnabled: data.leadStatusChangeEnabled,
        leadStatusChangeTriggers: data.leadStatusChangeTriggers,
        leadInactiveEnabled: data.leadInactiveEnabled,
        leadInactiveStatuses: data.leadInactiveStatuses,
        leadInactiveTimeValue: data.leadInactiveTimeValue,
        leadInactiveTimeUnit: data.leadInactiveTimeUnit,
      },
      update: {
        enabled: data.enabled,
        recipientUserIds: data.recipientUserIds,
        leadStatusChangeEnabled: data.leadStatusChangeEnabled,
        leadStatusChangeTriggers: data.leadStatusChangeTriggers,
        leadInactiveEnabled: data.leadInactiveEnabled,
        leadInactiveStatuses: data.leadInactiveStatuses,
        leadInactiveTimeValue: data.leadInactiveTimeValue,
        leadInactiveTimeUnit: data.leadInactiveTimeUnit,
      },
    });

    return this.mapToDomain(record);
  }
}

export const prismaNotificationConfigRepository =
  new PrismaNotificationConfigRepository();

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
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

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
      vacancyCountdownEnabled: boolean;
      vacancyCountdownDaysBefore: number[];
      vacancyStaleEnabled: boolean;
      vacancyStaleStatuses: string[];
      vacancyStaleTimeValue: number;
      vacancyStaleTimeUnit: string;
      vacancyStaleRepeatValue: number;
      vacancyStaleRepeatUnit: string;
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
      vacancyCountdownEnabled: record.vacancyCountdownEnabled,
      vacancyCountdownDaysBefore: record.vacancyCountdownDaysBefore,
      vacancyStaleEnabled: record.vacancyStaleEnabled,
      vacancyStaleStatuses: record.vacancyStaleStatuses as VacancyStatusType[],
      vacancyStaleTimeValue: record.vacancyStaleTimeValue,
      vacancyStaleTimeUnit: record.vacancyStaleTimeUnit as NotificationConfigProps["vacancyStaleTimeUnit"],
      vacancyStaleRepeatValue: record.vacancyStaleRepeatValue,
      vacancyStaleRepeatUnit: record.vacancyStaleRepeatUnit as NotificationConfigProps["vacancyStaleRepeatUnit"],
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
        vacancyCountdownEnabled: data.vacancyCountdownEnabled,
        vacancyCountdownDaysBefore: data.vacancyCountdownDaysBefore,
        vacancyStaleEnabled: data.vacancyStaleEnabled,
        vacancyStaleStatuses: data.vacancyStaleStatuses,
        vacancyStaleTimeValue: data.vacancyStaleTimeValue,
        vacancyStaleTimeUnit: data.vacancyStaleTimeUnit,
        vacancyStaleRepeatValue: data.vacancyStaleRepeatValue,
        vacancyStaleRepeatUnit: data.vacancyStaleRepeatUnit,
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
        vacancyCountdownEnabled: data.vacancyCountdownEnabled,
        vacancyCountdownDaysBefore: data.vacancyCountdownDaysBefore,
        vacancyStaleEnabled: data.vacancyStaleEnabled,
        vacancyStaleStatuses: data.vacancyStaleStatuses,
        vacancyStaleTimeValue: data.vacancyStaleTimeValue,
        vacancyStaleTimeUnit: data.vacancyStaleTimeUnit,
        vacancyStaleRepeatValue: data.vacancyStaleRepeatValue,
        vacancyStaleRepeatUnit: data.vacancyStaleRepeatUnit,
      },
    });

    return this.mapToDomain(record);
  }
}

export const prismaNotificationConfigRepository =
  new PrismaNotificationConfigRepository();

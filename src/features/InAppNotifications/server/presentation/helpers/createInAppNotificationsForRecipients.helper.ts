import type { InAppNotificationType } from "../../domain/entities/InAppNotification";
import { prismaInAppNotificationRepository } from "../../infrastructure/repositories/PrismaInAppNotificationRepository";

export interface CreateInAppNotificationRecipientInput {
  userId: string;
  tenantId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  triggeredByUserId?: string;
  metadata?: Record<string, unknown>;
}

export async function createInAppNotificationsForRecipients(
  recipients: CreateInAppNotificationRecipientInput[],
): Promise<void> {
  if (recipients.length === 0) {
    return;
  }

  try {
    await prismaInAppNotificationRepository.createMany(
      recipients.map((recipient) => ({
        userId: recipient.userId,
        tenantId: recipient.tenantId,
        type: recipient.type,
        title: recipient.title,
        body: recipient.body,
        resourceType: recipient.resourceType,
        resourceId: recipient.resourceId,
        actionUrl: recipient.actionUrl,
        triggeredByUserId: recipient.triggeredByUserId,
        metadata: recipient.metadata,
      })),
    );
  } catch (error) {
    console.warn("createInAppNotificationsForRecipients failed", {
      count: recipients.length,
      error,
    });
  }
}

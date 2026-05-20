import type { InAppNotificationType } from "../../domain/entities/InAppNotification";
import { CreateInAppNotificationUseCase } from "../../application/use-cases/CreateInAppNotificationUseCase";
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
}

export async function createInAppNotificationsForRecipients(
  recipients: CreateInAppNotificationRecipientInput[],
): Promise<void> {
  if (recipients.length === 0) {
    return;
  }

  const useCase = new CreateInAppNotificationUseCase(
    prismaInAppNotificationRepository,
  );

  for (const recipient of recipients) {
    const result = await useCase.execute({
      userId: recipient.userId,
      tenantId: recipient.tenantId,
      type: recipient.type,
      title: recipient.title,
      body: recipient.body,
      resourceType: recipient.resourceType,
      resourceId: recipient.resourceId,
      actionUrl: recipient.actionUrl,
    });

    if (!result.success) {
      console.error(
        "[createInAppNotificationsForRecipients] Failed to create in-app notification",
        {
          userId: recipient.userId,
          tenantId: recipient.tenantId,
          type: recipient.type,
          error: result.error,
        },
      );
    }
  }
}

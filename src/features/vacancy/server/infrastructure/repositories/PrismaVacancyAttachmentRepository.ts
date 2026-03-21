import prisma from "@lib/prisma";
import { $Enums } from "@/core/generated/prisma/client";
import type {
  IVacancyAttachmentRepository,
  VacancyAttachmentRecord,
} from "../../domain/interfaces/IVacancyAttachmentRepository";

const ATTACHMENT_SELECT = {
  id: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  subType: true,
  isValidated: true,
  validatedAt: true,
  validatedById: true,
  rejectionReason: true,
  vacancyId: true,
  vacancyCandidateId: true,
  uploadedById: true,
  createdAt: true,
} as const;

type PrismaAttachmentRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subType: string;
  isValidated: boolean;
  validatedAt: Date | null;
  validatedById: string | null;
  rejectionReason: string | null;
  vacancyId: string | null;
  vacancyCandidateId: string | null;
  uploadedById: string;
  createdAt: Date;
};

function toRecord(a: PrismaAttachmentRecord): VacancyAttachmentRecord {
  return {
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    subType: a.subType,
    isValidated: a.isValidated,
    validatedAt: a.validatedAt?.toISOString() ?? null,
    validatedById: a.validatedById,
    rejectionReason: a.rejectionReason,
    vacancyId: a.vacancyId,
    vacancyCandidateId: a.vacancyCandidateId,
    uploadedById: a.uploadedById,
    createdAt: a.createdAt.toISOString(),
  };
}

export class PrismaVacancyAttachmentRepository implements IVacancyAttachmentRepository {
  async findByVacancyId(vacancyId: string, tenantId: string): Promise<VacancyAttachmentRecord[]> {
    const records = await prisma.attachment.findMany({
      where: { vacancyId, tenantId },
      select: ATTACHMENT_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return records.map((r) => toRecord(r as unknown as PrismaAttachmentRecord));
  }

  async findById(
    attachmentId: string,
    tenantId: string,
  ): Promise<VacancyAttachmentRecord | null> {
    const record = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
      select: ATTACHMENT_SELECT,
    });
    if (!record) return null;
    return toRecord(record as unknown as PrismaAttachmentRecord);
  }

  async deleteById(attachmentId: string): Promise<void> {
    await prisma.attachment.delete({ where: { id: attachmentId } });
  }

  async validate(attachmentId: string, validatedById: string): Promise<VacancyAttachmentRecord> {
    const record = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedById,
        rejectionReason: null,
      },
      select: ATTACHMENT_SELECT,
    });
    return toRecord(record as unknown as PrismaAttachmentRecord);
  }

  async reject(attachmentId: string, reason: string): Promise<VacancyAttachmentRecord> {
    const record = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isValidated: false,
        validatedAt: null,
        validatedById: null,
        rejectionReason: reason,
      },
      select: ATTACHMENT_SELECT,
    });
    return toRecord(record as unknown as PrismaAttachmentRecord);
  }

  async countBySubType(vacancyId: string, subType: string, onlyValidated = false): Promise<number> {
    return prisma.attachment.count({
      where: {
        vacancyId,
        subType: subType as $Enums.AttachmentSubType,
        ...(onlyValidated ? { isValidated: true } : {}),
      },
    });
  }
}

export const prismaVacancyAttachmentRepository = new PrismaVacancyAttachmentRepository();

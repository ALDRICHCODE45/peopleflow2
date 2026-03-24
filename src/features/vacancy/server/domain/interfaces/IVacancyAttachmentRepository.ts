export interface VacancyAttachmentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subType: string;
  isValidated: boolean;
  validatedAt: string | null;
  validatedById: string | null;
  rejectionReason: string | null;
  vacancyId: string | null;
  vacancyCandidateId: string | null;
  uploadedById: string;
  createdAt: string;
}

export interface IVacancyAttachmentRepository {
  findByVacancyId(vacancyId: string, tenantId: string): Promise<VacancyAttachmentRecord[]>;
  findById(attachmentId: string, tenantId: string): Promise<VacancyAttachmentRecord | null>;
  deleteById(attachmentId: string, tenantId: string): Promise<void>;
  validate(attachmentId: string, validatedById: string, tenantId: string): Promise<VacancyAttachmentRecord>;
  reject(attachmentId: string, reason: string, tenantId: string): Promise<VacancyAttachmentRecord>;
  countBySubType(vacancyId: string, subType: string, tenantId: string, onlyValidated?: boolean): Promise<number>;
}

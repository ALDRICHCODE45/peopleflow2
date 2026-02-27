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
  findById(attachmentId: string, vacancyId: string, tenantId: string): Promise<VacancyAttachmentRecord | null>;
  deleteById(attachmentId: string): Promise<void>;
  validate(attachmentId: string, validatedById: string): Promise<VacancyAttachmentRecord>;
  reject(attachmentId: string, reason: string): Promise<VacancyAttachmentRecord>;
  countBySubType(vacancyId: string, subType: string, onlyValidated?: boolean): Promise<number>;
}

// Port — defines the contract, not the implementation

export interface UploadFileInput {
  buffer: Buffer;
  fileName: string; // original file name (used for display)
  key: string; // storage path key, e.g. "vacancies/{vacancyId}/jd/{uuid}.pdf"
  mimeType: string;
  fileSize: number; // bytes
}

export type UploadFileResult =
  | {
      ok: true;
      url: string; // public URL of the stored file
      key: string; // storage key (for deletion)
    }
  | { ok: false; error: string };

export type DeleteFileResult = { ok: true } | { ok: false; error: string };

export interface IStorageAdapter {
  upload(input: UploadFileInput): Promise<UploadFileResult>;
  delete(key: string): Promise<DeleteFileResult>;
  getPublicUrl(key: string): string; // synchronous — just builds the URL
}

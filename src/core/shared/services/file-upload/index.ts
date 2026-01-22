/**
 * Servicio de subida de archivos
 * @description Sistema stub preparado para conectar con DigitalOcean Spaces
 *
 * @example
 * ```typescript
 * // Uso del servicio directamente
 * import { fileUploadService } from '@/core/shared/services/file-upload';
 *
 * const result = await fileUploadService.upload(file, {
 *   attachableType: 'LEAD',
 *   attachableId: leadId,
 *   tenantId,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Uso del hook en componentes React
 * import { useFileUpload } from '@/core/shared/services/file-upload';
 *
 * function MyComponent() {
 *   const { uploadFile, isUploading, error } = useFileUpload();
 *   // ...
 * }
 * ```
 */

export { fileUploadService, FileUploadService } from "./file-upload.service";
export { useFileUpload } from "./hooks/useFileUpload";
export type {
  UploadConfig,
  UploadResult,
  DeleteResult,
  FileMetadata,
  IFileUploadService,
} from "./types";

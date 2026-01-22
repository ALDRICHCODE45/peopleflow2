/**
 * Tipos para el servicio de subida de archivos
 * @description Sistema preparado para conectar con DigitalOcean Spaces u otro proveedor
 */

export interface UploadConfig {
  /** Tipo de entidad a la que se asocia el archivo */
  attachableType: "LEAD" | "CONTACT" | "INTERACTION" | "VACANCY";
  /** ID de la entidad a la que se asocia el archivo */
  attachableId: string;
  /** ID del tenant */
  tenantId: string;
  /** Directorio opcional dentro del bucket */
  directory?: string;
  /** Tipos de archivo permitidos (MIME types) */
  allowedTypes?: string[];
  /** Tamaño máximo en bytes */
  maxSizeBytes?: number;
}

export interface UploadResult {
  /** Indica si la subida fue exitosa */
  success: boolean;
  /** URL pública del archivo (si aplica) */
  fileUrl: string | null;
  /** Nombre del archivo guardado */
  fileName?: string;
  /** Tamaño del archivo en bytes */
  fileSize?: number;
  /** Tipo MIME del archivo */
  mimeType?: string;
  /** Mensaje de error (si aplica) */
  error?: string;
}

export interface FileMetadata {
  /** ID único del archivo */
  id: string;
  /** Nombre original del archivo */
  originalName: string;
  /** Nombre guardado en el storage */
  storedName: string;
  /** URL pública o presignada */
  url: string;
  /** Tamaño en bytes */
  size: number;
  /** Tipo MIME */
  mimeType: string;
  /** Tipo de entidad asociada */
  attachableType: string;
  /** ID de la entidad asociada */
  attachableId: string;
  /** ID del tenant */
  tenantId: string;
  /** ID del usuario que subió el archivo */
  uploadedById: string;
  /** Fecha de subida */
  uploadedAt: Date;
}

export interface DeleteResult {
  /** Indica si la eliminación fue exitosa */
  success: boolean;
  /** Mensaje de error (si aplica) */
  error?: string;
}

export interface IFileUploadService {
  /**
   * Sube un archivo al storage
   * @param file Archivo a subir
   * @param config Configuración de la subida
   */
  upload(file: File, config: UploadConfig): Promise<UploadResult>;

  /**
   * Elimina un archivo del storage
   * @param fileUrl URL del archivo a eliminar
   */
  delete(fileUrl: string): Promise<DeleteResult>;

  /**
   * Obtiene la metadata de un archivo
   * @param fileUrl URL del archivo
   */
  getMetadata(fileUrl: string): Promise<FileMetadata | null>;

  /**
   * Genera una URL presignada para descarga directa
   * @param fileUrl URL del archivo
   * @param expiresIn Tiempo de expiración en segundos
   */
  getPresignedUrl(fileUrl: string, expiresIn?: number): Promise<string | null>;
}

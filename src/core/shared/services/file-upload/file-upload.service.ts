/**
 * Servicio stub para subida de archivos
 * @description Este servicio es un placeholder que debe ser reemplazado
 * con la implementación real conectada a DigitalOcean Spaces
 */

import type {
  IFileUploadService,
  UploadConfig,
  UploadResult,
  DeleteResult,
  FileMetadata,
} from "./types";

export class FileUploadService implements IFileUploadService {
  private static instance: FileUploadService;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Sube un archivo al storage
   * @stub Pendiente de implementar con DigitalOcean Spaces
   */
  async upload(file: File, config: UploadConfig): Promise<UploadResult> {
    console.warn(
      "[FileUploadService] Stub: upload() no implementado. Archivo:",
      file.name,
      "Config:",
      config
    );

    // Validaciones básicas que estarían en la implementación real
    if (config.maxSizeBytes && file.size > config.maxSizeBytes) {
      return {
        success: false,
        fileUrl: null,
        error: `El archivo excede el tamaño máximo permitido (${config.maxSizeBytes} bytes)`,
      };
    }

    if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
      return {
        success: false,
        fileUrl: null,
        error: `Tipo de archivo no permitido: ${file.type}`,
      };
    }

    return {
      success: false,
      fileUrl: null,
      error: "Servicio de archivos no configurado. Contacte al administrador.",
    };
  }

  /**
   * Elimina un archivo del storage
   * @stub Pendiente de implementar con DigitalOcean Spaces
   */
  async delete(fileUrl: string): Promise<DeleteResult> {
    console.warn(
      "[FileUploadService] Stub: delete() no implementado. URL:",
      fileUrl
    );

    return {
      success: false,
      error: "Servicio de archivos no configurado. Contacte al administrador.",
    };
  }

  /**
   * Obtiene la metadata de un archivo
   * @stub Pendiente de implementar
   */
  async getMetadata(fileUrl: string): Promise<FileMetadata | null> {
    console.warn(
      "[FileUploadService] Stub: getMetadata() no implementado. URL:",
      fileUrl
    );
    return null;
  }

  /**
   * Genera una URL presignada para descarga
   * @stub Pendiente de implementar con DigitalOcean Spaces
   */
  async getPresignedUrl(
    fileUrl: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    console.warn(
      "[FileUploadService] Stub: getPresignedUrl() no implementado. URL:",
      fileUrl,
      "Expires:",
      expiresIn
    );
    return null;
  }
}

// Exportar instancia singleton
export const fileUploadService = FileUploadService.getInstance();

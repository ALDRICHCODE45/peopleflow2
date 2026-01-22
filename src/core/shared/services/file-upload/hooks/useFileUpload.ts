"use client";

import { useState, useCallback } from "react";
import { fileUploadService } from "../file-upload.service";
import type { UploadConfig, UploadResult } from "../types";

interface UseFileUploadOptions {
  /** Callback cuando se inicia la subida */
  onUploadStart?: (file: File) => void;
  /** Callback cuando la subida es exitosa */
  onUploadSuccess?: (result: UploadResult) => void;
  /** Callback cuando hay un error */
  onUploadError?: (error: string) => void;
  /** Callback cuando termina (éxito o error) */
  onUploadComplete?: () => void;
}

interface UseFileUploadReturn {
  /** Estado de carga */
  isUploading: boolean;
  /** Progreso de subida (0-100) - stub siempre es 0 */
  progress: number;
  /** Último error */
  error: string | null;
  /** Última URL subida exitosamente */
  uploadedUrl: string | null;
  /** Función para subir un archivo */
  uploadFile: (file: File, config: UploadConfig) => Promise<UploadResult>;
  /** Función para eliminar un archivo */
  deleteFile: (fileUrl: string) => Promise<boolean>;
  /** Función para limpiar el estado */
  reset: () => void;
}

/**
 * Hook para manejar subida de archivos
 * @stub Las funciones de subida retornan error ya que el servicio no está implementado
 * @example
 * ```tsx
 * const { uploadFile, isUploading, error } = useFileUpload({
 *   onUploadSuccess: (result) => console.log('Subido:', result.fileUrl),
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   await uploadFile(file, {
 *     attachableType: 'LEAD',
 *     attachableId: leadId,
 *     tenantId,
 *   });
 * };
 * ```
 */
export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const {
    onUploadStart,
    onUploadSuccess,
    onUploadError,
    onUploadComplete,
  } = options;

  const uploadFile = useCallback(
    async (file: File, config: UploadConfig): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      onUploadStart?.(file);

      try {
        const result = await fileUploadService.upload(file, config);

        if (result.success) {
          setUploadedUrl(result.fileUrl);
          onUploadSuccess?.(result);
        } else {
          setError(result.error ?? "Error desconocido");
          onUploadError?.(result.error ?? "Error desconocido");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al subir el archivo";
        setError(errorMessage);
        onUploadError?.(errorMessage);
        return {
          success: false,
          fileUrl: null,
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
        setProgress(0);
        onUploadComplete?.();
      }
    },
    [onUploadStart, onUploadSuccess, onUploadError, onUploadComplete]
  );

  const deleteFile = useCallback(async (fileUrl: string): Promise<boolean> => {
    try {
      const result = await fileUploadService.delete(fileUrl);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result.success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar el archivo";
      setError(errorMessage);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);
  }, []);

  return {
    isUploading,
    progress,
    error,
    uploadedUrl,
    uploadFile,
    deleteFile,
    reset,
  };
}

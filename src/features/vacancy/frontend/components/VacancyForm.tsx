import type { VacancyDTO, CreateVacancyFormData } from "../types/vacancy.types";

/**
 * VacancyForm — STUB temporal (Fase 6 lo reemplazará con el formulario real)
 *
 * El DTO ahora usa campos como position, clientId, recruiterId, countryCode,
 * regionCode, etc. en lugar de los campos viejos (title, description, department, location).
 */
interface Props {
  vacancy?: VacancyDTO;
  onSubmit: (data: CreateVacancyFormData) => Promise<{ error: string | null }>;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
}

export const VacancyForm = ({ onOpenChange }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
      <p className="text-sm font-medium">Formulario en construcción</p>
      <p className="text-xs">
        El formulario de vacante está siendo actualizado al nuevo esquema.
      </p>
      <button
        type="button"
        className="mt-2 text-xs underline underline-offset-2"
        onClick={() => onOpenChange(false)}
      >
        Cerrar
      </button>
    </div>
  );
};

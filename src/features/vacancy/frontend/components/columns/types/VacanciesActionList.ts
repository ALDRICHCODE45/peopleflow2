import { IconSvgElement } from "@hugeicons/react";

export interface VacancyAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

export const createVacancyActions = (
  onEdit: (() => void) | undefined,
  onDelete: (() => void) | undefined,
  onViewDetail?: () => void,
): VacancyAction[] => {
  const actions: VacancyAction[] = [];

  if (onViewDetail) {
    actions.push({
      id: "view",
      label: "Ver detalle",
      onClick: onViewDetail,
    });
  }

  if (onEdit) {
    actions.push({
      id: "edit",
      label: "Editar",
      onClick: onEdit,
    });
  }

  if (onDelete) {
    actions.push({
      id: "delete",
      label: "Eliminar",
      variant: "destructive",
      onClick: onDelete,
    });
  }

  return actions;
};

import { IconSvgElement } from "@hugeicons/react";

export interface VacancyAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

export const createVacancyActions = (
  onEdit: () => void,
  onDelete: () => void,
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

  actions.push(
    {
      id: "edit",
      label: "Editar",
      onClick: onEdit,
    },
    {
      id: "delete",
      label: "Eliminar",
      variant: "destructive",
      onClick: onDelete,
    },
  );

  return actions;
};

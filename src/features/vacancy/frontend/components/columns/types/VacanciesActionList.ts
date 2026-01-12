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
): VacancyAction[] => {
  const actions: VacancyAction[] = [
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
  ];

  return actions;
};

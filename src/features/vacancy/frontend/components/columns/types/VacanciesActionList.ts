import type { IconSvgElement } from "@hugeicons/react";

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
  onApplyWarranty?: () => void,
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

  if (onApplyWarranty) {
    actions.push({
      id: "warranty",
      label: "Aplicar garantía",
      onClick: onApplyWarranty,
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

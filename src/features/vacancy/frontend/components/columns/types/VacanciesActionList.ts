import { UserSwitchIcon } from "@hugeicons/core-free-icons";
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
  onReassign?: () => void,
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

  if (onReassign) {
    actions.push({
      id: "reassign",
      label: "Reasignar",
      icon: UserSwitchIcon,
      onClick: onReassign,
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

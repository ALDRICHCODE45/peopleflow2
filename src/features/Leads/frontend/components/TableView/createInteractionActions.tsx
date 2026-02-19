import { IconSvgElement } from "@hugeicons/react";
import { PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

export interface InteractionAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

export const createInteractionActions = ({
  onEdit,
  onDelete,
}: Props): InteractionAction[] => {
  const actions: InteractionAction[] = [
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

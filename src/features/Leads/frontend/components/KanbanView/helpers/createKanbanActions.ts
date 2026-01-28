import { IconSvgElement } from "@hugeicons/react";

export interface LeadKanbanAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onReasingnar: () => void;
}

export const createKanbanActions = ({
  onEdit,
  onDelete,
  onReasingnar,
}: Props): LeadKanbanAction[] => {
  const actions: LeadKanbanAction[] = [
    {
      id: "edit",
      label: "Editar",
      onClick: onEdit,
    },
    {
      id: "reasignar",
      label: "Reasignar",
      onClick: onReasingnar,
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

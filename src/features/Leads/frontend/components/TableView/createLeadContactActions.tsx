import { IconSvgElement } from "@hugeicons/react";

export interface ContactActions {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onShowInteracciones: () => void;
}

export const createLeadContactActions = ({
  onEdit,
  onDelete,
  onShowInteracciones,
}: Props): ContactActions[] => {
  const actions: ContactActions[] = [
    {
      id: "edit",
      label: "Editar",
      onClick: onEdit,
    },
    {
      id: "interaction",
      label: "Interacciones",
      onClick: onShowInteracciones,
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

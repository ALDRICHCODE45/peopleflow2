import { IconSvgElement } from "@hugeicons/react";

export interface RoleAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  icon?: IconSvgElement;
  onClick: () => void;
}

export const createRoleActions = (
  onEdit: () => void,
  onDelete: () => void,
  onChangePermissons: () => void,
): RoleAction[] => {
  const actions: RoleAction[] = [
    {
      id: "edit",
      label: "Editar",
      onClick: onEdit,
    },
    {
      id: "permisos",
      label: "Permisos",
      onClick: onChangePermissons,
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

import { ContactAction } from "./ContactAction";

export const createActionContact = (
  onEdit: () => void,
  onDelete: () => void,
): ContactAction[] => {
  const actions: ContactAction[] = [
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

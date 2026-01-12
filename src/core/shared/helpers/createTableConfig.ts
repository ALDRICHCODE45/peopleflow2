import { TableConfig } from "../components/DataTable/TableTypes.types";

export const createTableConfig = <T>(
  baseConfig: TableConfig<T>,
  handlers: {
    onAdd?: () => void;
    onImport?: () => void;
    [key: string]: (() => void) | undefined;
  },
): TableConfig<T> => {
  return {
    ...baseConfig,
    filters: {
      ...baseConfig.filters,
      customFilter: baseConfig.filters?.customFilter
        ? {
          ...baseConfig.filters.customFilter,
          props: {
            ...baseConfig.filters.customFilter.props,
            ...handlers,
          },
        }
        : undefined,
    },
    actions: {
      ...baseConfig.actions,
      // Actualizar onAdd directamente si no hay customFilter o si se necesita sobrescribir
      onAdd: handlers.onAdd || baseConfig.actions?.onAdd,
    },
  };
};

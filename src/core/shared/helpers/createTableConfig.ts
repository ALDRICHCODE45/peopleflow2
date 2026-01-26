import {
  TableConfig,
  ServerSideConfig,
} from "../components/DataTable/TableTypes.types";

interface CreateTableConfigHandlers {
  onAdd?: () => void;
  onImport?: () => void;
  serverSide?: ServerSideConfig;
  // Allow any additional props to be passed to custom filter components
  [key: string]: unknown;
}

export const createTableConfig = <T>(
  baseConfig: TableConfig<T>,
  handlers: CreateTableConfigHandlers
): TableConfig<T> => {
  // Extraer serverSide de handlers para manejarlo por separado
  const { serverSide, ...restHandlers } = handlers;

  return {
    ...baseConfig,
    filters: {
      ...baseConfig.filters,
      customFilter: baseConfig.filters?.customFilter
        ? {
            ...baseConfig.filters.customFilter,
            props: {
              ...baseConfig.filters.customFilter.props,
              ...restHandlers,
            },
          }
        : undefined,
    },
    actions: {
      ...baseConfig.actions,
      // Actualizar onAdd directamente si no hay customFilter o si se necesita sobrescribir
      onAdd: restHandlers.onAdd || baseConfig.actions?.onAdd,
    },
    // Agregar configuración server-side si se proporciona
    ...(serverSide && { serverSide }),
  };
};

import {
  TableConfig,
  ServerSideConfig,
  FocusModeConfig,
} from "../components/DataTable/TableTypes.types";

interface CreateTableConfigHandlers {
  onAdd?: () => void;
  onImport?: () => void;
  serverSide?: ServerSideConfig;
  /** Configuración de focus mode — se aplica a nivel raíz del TableConfig */
  focusMode?: FocusModeConfig;
  // Allow any additional props to be passed to custom filter components
  [key: string]: unknown;
}

export const createTableConfig = <T>(
  baseConfig: TableConfig<T>,
  handlers: CreateTableConfigHandlers
): TableConfig<T> => {
  // Extraer campos de nivel raíz para que no contaminen customFilter.props
  const { serverSide, focusMode, ...restHandlers } = handlers;

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
      onAdd: restHandlers.onAdd || baseConfig.actions?.onAdd,
      ...(restHandlers.onBulkDelete ? { onBulkDelete: restHandlers.onBulkDelete } : {}),
      ...(restHandlers.onBulkReasign ? { onBulkReasign: restHandlers.onBulkReasign } : {}),
      ...(restHandlers.onBulkDuplicate
        ? { onBulkDuplicate: restHandlers.onBulkDuplicate }
        : {}),
    } as TableConfig<T>["actions"],
    // Campos de nivel raíz que se mergean con la base
    ...(serverSide && { serverSide }),
    ...(focusMode && {
      focusMode: { ...baseConfig.focusMode, ...focusMode },
    }),
  };
};

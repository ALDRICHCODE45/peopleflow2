import { useCallback, useEffect, useReducer } from "react";
import type { LeadStatus } from "@features/Leads/frontend/types";
import type { NotificationConfigDTO } from "../types";

export interface NotificationDraft {
  enabled: boolean;
  recipientUserIds: string[];
  activeActions: Record<string, boolean>;
  selectedStatuses: LeadStatus[];
  inactiveStatuses: LeadStatus[];
  inactiveTimeValue: number;
  inactiveTimeUnit: "horas" | "dias";
}

type Action =
  | { type: "HYDRATE"; config: NotificationConfigDTO }
  | { type: "SET_ENABLED"; enabled: boolean }
  | { type: "SET_RECIPIENTS"; ids: string[] }
  | { type: "TOGGLE_ACTION"; actionId: string; checked: boolean }
  | { type: "TOGGLE_STATUS"; status: LeadStatus; checked: boolean }
  | { type: "TOGGLE_INACTIVE_STATUS"; status: LeadStatus; checked: boolean }
  | { type: "SET_TIME_VALUE"; value: number }
  | { type: "SET_TIME_UNIT"; unit: "horas" | "dias" };

const initialState: NotificationDraft = {
  enabled: true,
  recipientUserIds: [],
  activeActions: {},
  selectedStatuses: [],
  inactiveStatuses: [],
  inactiveTimeValue: 48,
  inactiveTimeUnit: "horas",
};

function toggleInArray<T>(arr: T[], item: T, checked: boolean): T[] {
  return checked ? [...arr, item] : arr.filter((s) => s !== item);
}

function reducer(state: NotificationDraft, action: Action): NotificationDraft {
  switch (action.type) {
    case "HYDRATE":
      return {
        enabled: action.config.enabled,
        recipientUserIds: action.config.recipientUserIds,
        activeActions: {
          "lead-status-change": action.config.leadStatusChangeEnabled,
          "lead-inactive": action.config.leadInactiveEnabled,
        },
        selectedStatuses: action.config.leadStatusChangeTriggers,
        inactiveStatuses: action.config.leadInactiveStatuses,
        inactiveTimeValue: action.config.leadInactiveTimeValue,
        inactiveTimeUnit:
          action.config.leadInactiveTimeUnit === "HOURS" ? "horas" : "dias",
      };
    case "SET_ENABLED":
      return { ...state, enabled: action.enabled };
    case "SET_RECIPIENTS":
      return { ...state, recipientUserIds: action.ids };
    case "TOGGLE_ACTION":
      return {
        ...state,
        activeActions: {
          ...state.activeActions,
          [action.actionId]: action.checked,
        },
      };
    case "TOGGLE_STATUS":
      return {
        ...state,
        selectedStatuses: toggleInArray(
          state.selectedStatuses,
          action.status,
          action.checked,
        ),
      };
    case "TOGGLE_INACTIVE_STATUS":
      return {
        ...state,
        inactiveStatuses: toggleInArray(
          state.inactiveStatuses,
          action.status,
          action.checked,
        ),
      };
    case "SET_TIME_VALUE":
      return { ...state, inactiveTimeValue: action.value };
    case "SET_TIME_UNIT":
      return { ...state, inactiveTimeUnit: action.unit };
  }
}

export function useNotificationDraft(
  savedConfig: NotificationConfigDTO | null | undefined,
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (savedConfig) {
      dispatch({ type: "HYDRATE", config: savedConfig });
    }
  }, [savedConfig]);

  const setEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_ENABLED", enabled });
  }, []);

  const setRecipients = useCallback((ids: string[]) => {
    dispatch({ type: "SET_RECIPIENTS", ids });
  }, []);

  const toggleAction = useCallback((actionId: string, checked: boolean) => {
    dispatch({ type: "TOGGLE_ACTION", actionId, checked });
  }, []);

  const toggleStatus = useCallback((status: LeadStatus, checked: boolean) => {
    dispatch({ type: "TOGGLE_STATUS", status, checked });
  }, []);

  const toggleInactiveStatus = useCallback(
    (status: LeadStatus, checked: boolean) => {
      dispatch({ type: "TOGGLE_INACTIVE_STATUS", status, checked });
    },
    [],
  );

  const setTimeValue = useCallback((value: number) => {
    dispatch({ type: "SET_TIME_VALUE", value });
  }, []);

  const setTimeUnit = useCallback((unit: "horas" | "dias") => {
    dispatch({ type: "SET_TIME_UNIT", unit });
  }, []);

  return {
    state,
    setEnabled,
    setRecipients,
    toggleAction,
    toggleStatus,
    toggleInactiveStatus,
    setTimeValue,
    setTimeUnit,
  };
}

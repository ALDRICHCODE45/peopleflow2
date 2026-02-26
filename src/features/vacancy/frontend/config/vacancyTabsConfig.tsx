/**
 * Type-safe configuration for Vacancy list page tabs
 */
import {
  Layers,
  ClockIcon,
  Search01Icon,
  Target01Icon,
  UserGroup03Icon,
  CheckmarkSquare01Icon,
  PauseIcon,
  Cancel01Icon,
  SadIcon,
} from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import type { VacancyStatusType } from "../types/vacancy.types";

/**
 * Union type for all valid tab IDs in the Vacancies page
 */
export type VacancyTabId = "all" | VacancyStatusType;

/**
 * Configuration interface for a single tab
 */
export interface VacancyTabConfig {
  /** Unique identifier for the tab */
  id: VacancyTabId;
  /** Display label for the tab */
  label: string;
  /** Optional count to display (usually set dynamically) */
  count?: number;
  /** Status filter value (undefined for "all" tab) */
  statusFilter?: VacancyStatusType;
  /** Icon component for the tab */
  icon: IconSvgElement;
}

/**
 * Static tabs configuration - defines the structure without dynamic counts
 */
export const VACANCY_TABS_CONFIG: readonly VacancyTabConfig[] = [
  {
    id: "all",
    label: "Todas",
    icon: Layers,
  },
  {
    id: "QUICK_MEETING",
    label: "Quick Meeting",
    statusFilter: "QUICK_MEETING",
    icon: ClockIcon,
  },
  {
    id: "HUNTING",
    label: "Hunting",
    statusFilter: "HUNTING",
    icon: Search01Icon,
  },
  {
    id: "FOLLOW_UP",
    label: "Follow Up",
    statusFilter: "FOLLOW_UP",
    icon: Target01Icon,
  },
  {
    id: "PRE_PLACEMENT",
    label: "Pre-Placement",
    statusFilter: "PRE_PLACEMENT",
    icon: UserGroup03Icon,
  },
  {
    id: "PLACEMENT",
    label: "Placement",
    statusFilter: "PLACEMENT",
    icon: CheckmarkSquare01Icon,
  },
  {
    id: "STAND_BY",
    label: "Stand By",
    statusFilter: "STAND_BY",
    icon: PauseIcon,
  },
  {
    id: "CANCELADA",
    label: "Cancelada",
    statusFilter: "CANCELADA",
    icon: Cancel01Icon,
  },
  {
    id: "PERDIDA",
    label: "Perdida",
    statusFilter: "PERDIDA",
    icon: SadIcon,
  },
] as const;

/**
 * Enriches the tabs config with dynamic counts.
 * Supports multi-select tabs: shows count on "all" when no tabs selected,
 * or on each selected tab.
 *
 * @param activeTabs - The currently active tab IDs (empty = "all")
 * @param totalCount - The total count from the current query (optional)
 * @returns Tabs config with count set on the active tabs
 *
 * @example
 * ```tsx
 * const tabsConfig = enrichVacancyTabsWithCounts(activeTabs, paginationMeta?.totalCount);
 * <DataTableMultiTabs tabs={tabsConfig} activeTabs={activeTabs} onTabsChange={handleMultiTabChange} />
 * ```
 */
export function enrichVacancyTabsWithCounts(
  activeTabs: string[],
  totalCount?: number
): VacancyTabConfig[] {
  return VACANCY_TABS_CONFIG.map((tab) => ({
    ...tab,
    count:
      activeTabs.length === 0 && tab.id === "all"
        ? totalCount
        : activeTabs.includes(tab.id)
          ? totalCount
          : undefined,
  }));
}

/**
 * Get the status filter for a given tab ID
 *
 * @param tabId - The tab ID to get the status filter for
 * @returns The VacancyStatusType if the tab has a filter, undefined otherwise
 */
export function getVacancyStatusFromTab(
  tabId: string
): VacancyStatusType | undefined {
  const tab = VACANCY_TABS_CONFIG.find((t) => t.id === tabId);
  return tab?.statusFilter;
}

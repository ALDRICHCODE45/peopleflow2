/**
 * Type-safe configuration for Vacancy list page tabs
 */
import {
  Layers,
  PlayCircleIcon,
  FileEditIcon,
  Lock,
  Archive,
} from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import type { VacancyStatus } from "../types/vacancy.types";

/**
 * Union type for all valid tab IDs in the Vacancies page
 */
export type VacancyTabId = "all" | VacancyStatus;

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
  statusFilter?: VacancyStatus;
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
    id: "OPEN",
    label: "Abiertas",
    statusFilter: "OPEN",
    icon: PlayCircleIcon,
  },
  {
    id: "DRAFT",
    label: "Borrador",
    statusFilter: "DRAFT",
    icon: FileEditIcon,
  },
  {
    id: "CLOSED",
    label: "Cerradas",
    statusFilter: "CLOSED",
    icon: Lock,
  },
  {
    id: "ARCHIVED",
    label: "Archivadas",
    statusFilter: "ARCHIVED",
    icon: Archive,
  },
] as const;

/**
 * Enriches the tabs config with dynamic counts.
 * Only the currently active tab displays its count.
 *
 * @param activeTab - The currently active tab ID
 * @param totalCount - The total count from the current query (optional)
 * @returns Tabs config with count set on the active tab
 *
 * @example
 * ```tsx
 * const tabsConfig = enrichVacancyTabsWithCounts(activeTab, paginationMeta?.totalCount);
 * <DataTableTabs tabs={tabsConfig} activeTab={activeTab} onTabChange={handleTabChange} />
 * ```
 */
export function enrichVacancyTabsWithCounts(
  activeTab: VacancyTabId,
  totalCount?: number
): VacancyTabConfig[] {
  return VACANCY_TABS_CONFIG.map((tab) => ({
    ...tab,
    count: tab.id === activeTab ? totalCount : undefined,
  }));
}

/**
 * Get the status filter for a given tab ID
 *
 * @param tabId - The tab ID to get the status filter for
 * @returns The VacancyStatus if the tab has a filter, undefined otherwise
 */
export function getVacancyStatusFromTab(
  tabId: string
): VacancyStatus | undefined {
  const tab = VACANCY_TABS_CONFIG.find((t) => t.id === tabId);
  return tab?.statusFilter;
}

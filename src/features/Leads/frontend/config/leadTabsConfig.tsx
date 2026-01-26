/**
 * Type-safe configuration for Lead list page tabs
 */
import {
  Layers,
  Target01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  PauseIcon,
  UserGroupIcon,
  MessageMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import type { LeadStatus } from "../types";

/**
 * Union type for all valid tab IDs in the Leads page
 */
export type LeadTabId = "all" | LeadStatus;

/**
 * Configuration interface for a single tab
 */
export interface LeadTabConfig {
  /** Unique identifier for the tab */
  id: LeadTabId;
  /** Display label for the tab */
  label: string;
  /** Optional count to display (usually set dynamically) */
  count?: number;
  /** Status filter value (undefined for "all" tab) */
  statusFilter?: LeadStatus;
  /** Icon component for the tab */
  icon: IconSvgElement;
}

/**
 * Static tabs configuration - defines the structure without dynamic counts
 */
export const LEAD_TABS_CONFIG: readonly LeadTabConfig[] = [
  {
    id: "all",
    label: "Todos",
    icon: Layers,
  },
  {
    id: "CONTACTO_CALIDO",
    label: "Contacto Calido",
    statusFilter: "CONTACTO_CALIDO",
    icon: Target01Icon,
  },
  {
    id: "SOCIAL_SELLING",
    label: "Social Selling",
    statusFilter: "SOCIAL_SELLING",
    icon: MessageMultiple02Icon,
  },
  {
    id: "CITA_AGENDADA",
    label: "Cita Agendada",
    statusFilter: "CITA_AGENDADA",
    icon: Calendar03Icon,
  },
  {
    id: "CITA_VALIDADA",
    label: "Cita Validada",
    statusFilter: "CITA_VALIDADA",
    icon: CheckmarkCircle01Icon,
  },
  {
    id: "POSICIONES_ASIGNADAS",
    label: "Posiciones",
    statusFilter: "POSICIONES_ASIGNADAS",
    icon: UserGroupIcon,
  },
  {
    id: "STAND_BY",
    label: "Stand By",
    statusFilter: "STAND_BY",
    icon: PauseIcon,
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
 * const tabsConfig = enrichLeadTabsWithCounts(activeTab, paginationMeta?.totalCount);
 * <DataTableTabs tabs={tabsConfig} activeTab={activeTab} onTabChange={handleTabChange} />
 * ```
 */
export function enrichLeadTabsWithCounts(
  activeTab: LeadTabId,
  totalCount?: number
): LeadTabConfig[] {
  return LEAD_TABS_CONFIG.map((tab) => ({
    ...tab,
    count: tab.id === activeTab ? totalCount : undefined,
  }));
}

/**
 * Get the status filter for a given tab ID
 *
 * @param tabId - The tab ID to get the status filter for
 * @returns The LeadStatus if the tab has a filter, undefined otherwise
 */
export function getLeadStatusFromTab(tabId: string): LeadStatus | undefined {
  const tab = LEAD_TABS_CONFIG.find((t) => t.id === tabId);
  return tab?.statusFilter;
}

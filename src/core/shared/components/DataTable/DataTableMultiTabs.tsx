"use client";

import { ScrollArea, ScrollBar } from "../../ui/shadcn/scroll-area";
import { cn } from "@lib/utils";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";

export interface MultiTabConfig {
  id: string;
  label: string;
  count?: number;
  icon: IconSvgElement;
}

interface DataTableMultiTabsProps {
  tabs: MultiTabConfig[];
  activeTabs: string[];
  onTabsChange: (ids: string[]) => void;
  /** ID of the "all" tab that clears selection (default: "all") */
  allTabId?: string;
}

export function DataTableMultiTabs({
  tabs,
  activeTabs,
  onTabsChange,
  allTabId = "all",
}: DataTableMultiTabsProps) {
  const handleClick = (tabId: string) => {
    if (tabId === allTabId) {
      onTabsChange([]);
      return;
    }

    if (activeTabs.includes(tabId)) {
      onTabsChange(activeTabs.filter((id) => id !== tabId));
    } else {
      onTabsChange([...activeTabs, tabId]);
    }
  };

  const isActive = (tabId: string) => {
    if (tabId === allTabId) return activeTabs.length === 0;
    return activeTabs.includes(tabId);
  };

  const activeClass =
    "text-primary dark:!text-primary border-primary dark:!border-primary";
  const inactiveClass =
    "text-muted-foreground border-transparent hover:text-primary";

  const renderTab = (tab: MultiTabConfig) => (
    <button
      key={tab.id}
      type="button"
      onClick={() => handleClick(tab.id)}
      className={cn(
        "inline-flex items-center gap-1.5 px-0 py-3 flex-shrink-0 rounded-none border-0 border-b-2 bg-transparent transition-colors cursor-pointer text-sm font-medium",
        isActive(tab.id) ? activeClass : inactiveClass,
      )}
    >
      <HugeiconsIcon
        icon={tab.icon}
        className={cn(
          "h-4 w-4",
          isActive(tab.id)
            ? "text-primary dark:!text-primary"
            : "text-muted-foreground",
        )}
      />
      {tab.label}
    </button>
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-6 min-w-fit border-b border-border">
        {tabs.map(renderTab)}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

"use client";

import { Tabs, TabsList, TabsTrigger } from "@shadcn/tabs";
import { Badge } from "@shadcn/badge";

export interface TabConfig {
  id: string;
  label: string;
  count?: number;
  filterValue?: string;
}

interface DataTableTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DataTableTabs({
  tabs,
  activeTab,
  onTabChange,
}: DataTableTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList
        className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0"
        aria-label="Filtros de estado"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {tab.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

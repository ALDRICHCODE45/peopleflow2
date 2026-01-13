"use client";

import { Tabs, TabsList, TabsTrigger } from "@shadcn/tabs";
import { Badge } from "@shadcn/badge";
import { ScrollArea, ScrollBar } from "../../ui/shadcn/scroll-area";
import { cn } from "@lib/utils";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";

export interface TabConfig {
  id: string;
  label: string;
  count?: number;
  filterValue?: string;
  icon: IconSvgElement;
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
    <>
      {/* Versión mobile con ScrollArea */}
      <div className="block sm:hidden w-full">
        <ScrollArea className="w-full">
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList
              variant="line"
              className="h-auto flex-nowrap justify-start gap-6 bg-transparent p-0 min-w-fit border-b border-border"
              aria-label="Filtros de estado"
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group data-[state=active]:text-primary dark:data-[state=active]:!text-primary text-muted-foreground px-0 py-3 flex-shrink-0 rounded-none border-0 border-b border-transparent data-[state=active]:border-primary dark:data-[state=active]:!border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:relative data-[state=active]:z-10 data-[state=active]:mb-[-1px] hover:text-foreground transition-colors after:hidden"
                >
                  <HugeiconsIcon
                    icon={tab.icon}
                    className={cn(
                      "h-4 w-4",
                      activeTab === tab.id
                        ? "text-primary dark:!text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Versión desktop sin ScrollArea */}
      <div className="hidden sm:block sm:w-4/4 ">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList
            variant="line"
            className="h-auto flex-wrap justify-start gap-6 bg-transparent p-0 "
            aria-label="Filtros de estado"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="hover:text-primary group data-[state=active]:text-primary dark:data-[state=active]:!text-primary text-muted-foreground px-0 py-3 flex-shrink-0 rounded-none border-0 border-b border-transparent data-[state=active]:border-primary dark:data-[state=active]:!border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:relative data-[state=active]:z-10 data-[state=active]:mb-[-1px] hover:text-primary transition-colors after:hidden"
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  className={cn(
                    "h-4 w-4 ",
                    activeTab === tab.id
                      ? "text-primary dark:!text-primary"
                      : "text-muted-foreground"
                  )}
                />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}

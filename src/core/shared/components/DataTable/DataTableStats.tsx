"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@shadcn/card";
import { Skeleton } from "@shadcn/skeleton";
import { ReactNode } from "react";

export interface StatCardConfig {
  id: string;
  label: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
}

interface DataTableStatsProps {
  stats: StatCardConfig[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 5;
}

const gridColsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

export function DataTableStats({
  stats,
  isLoading = false,
  columns = 4,
}: DataTableStatsProps) {
  if (isLoading) {
    return (
      <div
        className={`grid gap-4 ${gridColsMap[columns]}`}
        role="region"
        aria-label="Cargando estadisticas"
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${gridColsMap[columns]}`}
      role="region"
      aria-label="Estadisticas de la tabla"
    >
      {stats.map((stat) => (
        <Card key={stat.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            {stat.icon && (
              <div className="text-muted-foreground">{stat.icon}</div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

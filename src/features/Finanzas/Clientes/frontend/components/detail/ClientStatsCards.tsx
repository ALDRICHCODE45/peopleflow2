"use client";

import { Card, CardContent } from "@/core/shared/ui/shadcn/card";

interface StatCardProps {
  label: string;
  value: number;
  accentColor: string;
}

function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full ${accentColor}`}
      />
      <CardContent className="pl-7 pr-4 py-3.5">
        <p className="text-xs text-muted-foreground tracking-wide">{label}</p>
        <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ClientStatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Asignadas" value={0} accentColor="bg-indigo-500" />
      <StatCard label="Perdidas" value={0} accentColor="bg-rose-500" />
      <StatCard label="Canceladas" value={0} accentColor="bg-amber-500" />
      <StatCard label="Placements" value={0} accentColor="bg-emerald-500" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { useRolesWithStatsQuery } from "../hooks/useRoles";
import { RoleColumns } from "../components/RoleColumns";
import { RoleSheetForm } from "../components/RoleSheetForm";
import { RolesTableConfig } from "../tableConfig/RolesTableConfig";

export function RolesListPage() {
  const { data: roles = [], isLoading } = useRolesWithStatsQuery();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tableConfig = createTableConfig(RolesTableConfig, {
    onAdd: () => setIsCreateOpen(true),
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Administra los roles y sus permisos del sistema
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={RoleColumns}
            data={roles}
            config={tableConfig}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Sheet para crear rol - solo usuarios con permisos*/}
      <PermissionGuard
        permissions={[
          PermissionActions.roles.gestionar,
          PermissionActions.roles.crear,
        ]}
      >
        <RoleSheetForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </PermissionGuard>
    </div>
  );
}

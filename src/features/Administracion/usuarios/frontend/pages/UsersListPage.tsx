"use client";

import { useState } from "react";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { useTenantUsersQuery } from "../hooks/useUsers";
import { UserColumns } from "../components/UserColumns";
import { UserSheetForm } from "../components/UserSheetForm";
import { UsersTableConfig } from "../tableConfig/UsersTableConfig";

export function UsersListPage() {
  const { data: users = [], isLoading } = useTenantUsersQuery();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tableConfig = createTableConfig(UsersTableConfig, {
    onAdd: () => setIsCreateOpen(true),
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu organización
          </p>
        </div>
        <PermissionGuard
          permissions={[
            PermissionActions.usuarios.crear,
            PermissionActions.usuarios.gestionar,
          ]}
        >
          <Button onClick={() => setIsCreateOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={UserColumns}
            data={users}
            config={tableConfig}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Sheet para crear usuario */}
      <UserSheetForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

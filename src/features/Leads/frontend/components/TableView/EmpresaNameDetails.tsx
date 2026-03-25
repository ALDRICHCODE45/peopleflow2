"use client";
import { lazy, Suspense } from "react";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import type { Row } from "@tanstack/react-table";
import type { Lead } from "../../types";
import { useModalState } from "@/core/shared/hooks";

const LeadDetailSheet = lazy(() =>
  import("./LeadDetailSheet").then((mod) => ({
    default: mod.LeadDetailSheet,
  })),
);

export const EmpresaNameDetials = ({ row }: { row: Row<Lead> }) => {
  const lead = row.original;

  const {
    isOpen: isDetailOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
  } = useModalState();

  return (
    <div>
      <div
        onClick={() => openDetailModal()}
        className="flex flex-col min-w-0 w-full overflow-hidden cursor-pointer group"
      >
        <span className="truncate font-medium group-hover:text-primary transition-colors group-hover:underline underline-offset-4 decoration-primary/50">
          {lead.companyName}
        </span>
        {lead.sectorName && (
          <span className="text-xs text-muted-foreground truncate">
            {lead.sectorName}
          </span>
        )}
      </div>

      {isDetailOpen && (
        <PermissionGuard
          permissions={[
            PermissionActions.leads.acceder,
            PermissionActions.leads.gestionar,
          ]}
        >
          <Suspense>
            <LeadDetailSheet
              lead={lead}
              open={isDetailOpen}
              onOpenChange={closeDetailModal}
            />
          </Suspense>
        </PermissionGuard>
      )}
    </div>
  );
};

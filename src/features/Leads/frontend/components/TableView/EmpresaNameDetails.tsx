"use client";
import { lazy, Suspense } from "react";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { Row } from "@tanstack/react-table";
import { Lead } from "../../types";
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
        className="flex flex-col min-w-0 w-full overflow-hidden cursor-pointer"
      >
        <p className="font-medium truncate">{lead.companyName}</p>
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

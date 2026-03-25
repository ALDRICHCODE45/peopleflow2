"use client";

import { useMemo, useRef, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/shared/ui/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useReassignVacancy } from "../../hooks/useReassignVacancy";
import {
  REASSIGNMENT_REASON_LABELS,
  type ReassignmentReasonType,
  type VacancyDTO,
  type VacancyStatusType,
} from "../../types/vacancy.types";
import type { TenantUser } from "@/features/Administracion/usuarios/frontend/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

/** Statuses where a vacancy can be reassigned (active, not terminal) */
const REASSIGNABLE_STATUSES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "STAND_BY",
];

interface RecruiterReassignPopoverProps {
  vacancy: VacancyDTO;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Static (non-interactive) recruiter cell display */
function RecruiterDisplay({
  name,
  email,
  avatar,
  interactive = false,
}: {
  name: string;
  email?: string | null;
  avatar?: string | null;
  interactive?: boolean;
}) {
  const initials = getInitials(name);
  return (
    <div
      className={`flex items-center gap-3 max-w-50 ${
        interactive ? "cursor-pointer group/recruiter" : ""
      }`}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatar ?? undefined} alt={name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div
          className={`font-medium text-sm truncate ${
            interactive
              ? "group-hover/recruiter:text-primary transition-colors"
              : ""
          }`}
        >
          {name}
        </div>
        {email && (
          <span className="text-muted-foreground text-xs truncate block">
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

export function RecruiterReassignPopover({
  vacancy,
}: RecruiterReassignPopoverProps) {
  const { recruiterName, recruiterId, recruiterEmail, recruiterAvatar } =
    vacancy;
  const displayName = recruiterName ?? recruiterId;

  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canReassign =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.reasignar,
      PermissionActions.vacantes.gestionar,
    ]);

  const isReassignableStatus = REASSIGNABLE_STATUSES.includes(vacancy.status);
  const isInteractive = canReassign && isReassignableStatus;

  // --- Popover state ---
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [reason, setReason] = useState<ReassignmentReasonType>("REASSIGNMENT");
  const [notes, setNotes] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Data hooks (lazy-loaded) ---
  const { data: users, isPending: isLoadingUsers } = useTenantUsersQuery();
  const reassignMutation = useReassignVacancy();

  // Filter users: exclude current recruiter, apply search
  const filteredUsers = useMemo(() => {
    const list = (users ?? []).filter((u) => u.id !== recruiterId);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, recruiterId, search]);

  // --- Handlers ---
  const resetState = () => {
    setStep(1);
    setSearch("");
    setSelectedUser(null);
    setReason("REASSIGNMENT");
    setNotes("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handleSelectUser = (user: TenantUser) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setStep(1);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;

    try {
      await reassignMutation.mutateAsync({
        vacancyId: vacancy.id,
        newRecruiterId: selectedUser.id,
        reason,
        notes: notes.trim() || undefined,
      });
      handleOpenChange(false);
    } catch {
      // Error handled by mutation hook (shows toast)
    }
  };

  // --- Non-interactive: static display ---
  if (!isInteractive) {
    return (
      <RecruiterDisplay
        name={displayName}
        email={recruiterEmail}
        avatar={recruiterAvatar}
      />
    );
  }

  // --- Interactive: Popover ---
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="text-left w-full">
          <RecruiterDisplay
            name={displayName}
            email={recruiterEmail}
            avatar={recruiterAvatar}
            interactive
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }}
      >
        {step === 1 && (
          <div className="flex flex-col">
            {/* Search input */}
            <div className="p-2.5 pb-1.5">
              <Input
                ref={searchInputRef}
                placeholder="Buscar reclutador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>

            {/* User list */}
            <div className="max-h-56 overflow-y-auto overscroll-contain px-1.5 pb-1.5">
              {isLoadingUsers ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Cargando usuarios...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin resultados
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage
                        src={user.avatar ?? undefined}
                        alt={user.name ?? user.email}
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(user.name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-medium text-sm truncate">
                        {user.name ?? user.email}
                      </div>
                      <span className="text-muted-foreground text-xs truncate block">
                        {user.email}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedUser && (
          <div className="flex flex-col p-3 gap-3">
            {/* Header with back button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleBack}
                disabled={reassignMutation.isPending}
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} className="size-3.5" />
              </Button>
              <span className="font-medium text-sm">
                ¿Reasignar a {selectedUser.name ?? selectedUser.email}?
              </span>
            </div>

            {/* Selected user preview */}
            <div className="flex items-center gap-2.5 rounded-md bg-muted/50 px-2.5 py-2">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage
                  src={selectedUser.avatar ?? undefined}
                  alt={selectedUser.name ?? selectedUser.email}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(selectedUser.name ?? selectedUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {selectedUser.name ?? selectedUser.email}
                </div>
                <span className="text-muted-foreground text-xs truncate block">
                  {selectedUser.email}
                </span>
              </div>
            </div>

            {/* Reason select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Motivo
              </label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as ReassignmentReasonType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASSIGNMENT_REASON_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Notas (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo adicional..."
                rows={2}
                className="min-h-0 resize-none text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={reassignMutation.isPending}
              >
                Cancelar
              </Button>
              <LoadingButton
                size="sm"
                isLoading={reassignMutation.isPending}
                loadingText="Reasignando..."
                onClick={handleConfirm}
              >
                Confirmar
              </LoadingButton>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

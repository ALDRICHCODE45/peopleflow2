"use client";

import { useForm } from "@tanstack/react-form";
import {
  useCreateUser,
  useUpdateUser,
  useAvailableRolesQuery,
} from "./useUsers";
import { createUserSchema, editUserSchema } from "../schemas/user.schema";
import type { TenantUser } from "../types";

export function useUserSheetForm({
  user,
  onOpenChange,
}: {
  user?: TenantUser;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = !!user;
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: roles = [] } = useAvailableRolesQuery();

  const form = useForm({
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      password: "",
      roleId: "",
      avatar: user?.avatar ?? "",
    },
    validators: {
      onSubmit: isEditing ? editUserSchema : createUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (isEditing) {
        await updateUserMutation.mutateAsync({
          userId: user.id,
          data: {
            name: value.name || undefined,
            email: value.email,
            avatar: value.avatar || undefined,
          },
        });
      } else {
        await createUserMutation.mutateAsync({
          email: value.email,
          password: value.password,
          name: value.name,
          roleId: value.roleId || undefined,
          avatar: value.avatar || undefined,
        });
      }
      onOpenChange(false);
    },
  });

  return {
    form,
    roles,
    isEditing,
    isSubmitting: createUserMutation.isPending || updateUserMutation.isPending,
  };
}

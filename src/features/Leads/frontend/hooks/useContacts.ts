"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { ContactFormData, Contact } from "../types";
import {
  addContactToLeadAction,
  updateContactAction,
  deleteContactAction,
  getContactsByLeadAction,
} from "../../server/presentation/actions/contact.actions";

/**
 * Hook para obtener contactos de un lead
 */
export function useContactsByLead(leadId: string | null) {
  return useQuery({
    queryKey: ["contacts", "by-lead", leadId],
    queryFn: async (): Promise<Contact[]> => {
      if (!leadId) return [];
      const result = await getContactsByLeadAction(leadId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.contacts;
    },
    enabled: !!leadId,
  });
}

/**
 * Hook para agregar un contacto a un lead
 */
export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      data,
    }: {
      leadId: string;
      data: ContactFormData;
    }) => {
      const result = await addContactToLeadAction(leadId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", "by-lead", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      showToast({
        type: "success",
        title: "Contacto agregado",
        description: "El contacto se ha agregado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al agregar el contacto",
      });
    },
  });
}

/**
 * Hook para actualizar un contacto
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      data,
    }: {
      contactId: string;
      data: Partial<ContactFormData>;
    }) => {
      const result = await updateContactAction(contactId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      showToast({
        type: "success",
        title: "Contacto actualizado",
        description: "El contacto se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el contacto",
      });
    },
  });
}

/**
 * Hook para eliminar un contacto
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const result = await deleteContactAction(contactId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      showToast({
        type: "success",
        title: "Contacto eliminado",
        description: "El contacto se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar el contacto",
      });
    },
  });
}

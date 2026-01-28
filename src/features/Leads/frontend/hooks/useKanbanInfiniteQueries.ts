"use client";

import { useMemo } from "react";
import { DEFAULT_KANBAN_COLUMNS } from "../components/KanbanView/kanbanTypes";
import type { Lead, LeadStatus } from "../types";
import {
  useInfiniteLeadsByStatus,
  type KanbanFilters,
  type UseInfiniteLeadsByStatusReturn,
} from "./useInfiniteLeadsByStatus";

export interface KanbanColumnQuery {
  status: LeadStatus;
  query: UseInfiniteLeadsByStatusReturn;
}

/**
 * Orchestrates 8 infinite queries (one per kanban column)
 * Each column loads leads independently with its own pagination
 */
export function useKanbanInfiniteQueries(filters: KanbanFilters) {
  // Create individual infinite queries for each column
  // Note: We need to call hooks in a predictable order, so we use the static column list
  const contactoQuery = useInfiniteLeadsByStatus("CONTACTO", filters);
  const socialSellingQuery = useInfiniteLeadsByStatus("SOCIAL_SELLING", filters);
  const contactoCalidoQuery = useInfiniteLeadsByStatus("CONTACTO_CALIDO", filters);
  const citaAgendadaQuery = useInfiniteLeadsByStatus("CITA_AGENDADA", filters);
  const citaAtendidaQuery = useInfiniteLeadsByStatus("CITA_ATENDIDA", filters);
  const citaValidadaQuery = useInfiniteLeadsByStatus("CITA_VALIDADA", filters);
  const posicionesAsignadasQuery = useInfiniteLeadsByStatus("POSICIONES_ASIGNADAS", filters);
  const standByQuery = useInfiniteLeadsByStatus("STAND_BY", filters);

  // Combine all queries into an array
  const queries: KanbanColumnQuery[] = useMemo(
    () => [
      { status: "CONTACTO" as const, query: contactoQuery },
      { status: "SOCIAL_SELLING" as const, query: socialSellingQuery },
      { status: "CONTACTO_CALIDO" as const, query: contactoCalidoQuery },
      { status: "CITA_AGENDADA" as const, query: citaAgendadaQuery },
      { status: "CITA_ATENDIDA" as const, query: citaAtendidaQuery },
      { status: "CITA_VALIDADA" as const, query: citaValidadaQuery },
      { status: "POSICIONES_ASIGNADAS" as const, query: posicionesAsignadasQuery },
      { status: "STAND_BY" as const, query: standByQuery },
    ],
    [
      contactoQuery,
      socialSellingQuery,
      contactoCalidoQuery,
      citaAgendadaQuery,
      citaAtendidaQuery,
      citaValidadaQuery,
      posicionesAsignadasQuery,
      standByQuery,
    ]
  );

  // Combine all leads from all pages for each status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      CONTACTO: [],
      SOCIAL_SELLING: [],
      CONTACTO_CALIDO: [],
      CITA_AGENDADA: [],
      CITA_ATENDIDA: [],
      CITA_VALIDADA: [],
      POSICIONES_ASIGNADAS: [],
      STAND_BY: [],
    };

    for (const { status, query } of queries) {
      grouped[status] = query.data?.pages.flatMap((page) => page.data) ?? [];
    }

    return grouped;
  }, [queries]);

  // Get total counts for each status (from server pagination)
  const totalCountByStatus = useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      CONTACTO: 0,
      SOCIAL_SELLING: 0,
      CONTACTO_CALIDO: 0,
      CITA_AGENDADA: 0,
      CITA_ATENDIDA: 0,
      CITA_VALIDADA: 0,
      POSICIONES_ASIGNADAS: 0,
      STAND_BY: 0,
    };

    for (const { status, query } of queries) {
      // Get totalCount from the first page's pagination metadata
      counts[status] = query.data?.pages[0]?.pagination.totalCount ?? 0;
    }

    return counts;
  }, [queries]);

  // Create a Map for quick query lookup by status
  const queryByStatus = useMemo(() => {
    const map = new Map<LeadStatus, UseInfiniteLeadsByStatusReturn>();
    queries.forEach(({ status, query }) => map.set(status, query));
    return map;
  }, [queries]);

  // Aggregate loading states
  const isLoading = queries.some(({ query }) => query.isLoading);
  const isFetching = queries.some(({ query }) => query.isFetching);

  // Flatten all leads for drag & drop (needs full list for status lookups)
  const allLeads = useMemo(() => {
    return Object.values(leadsByStatus).flat();
  }, [leadsByStatus]);

  return {
    leadsByStatus,
    totalCountByStatus,
    queries,
    queryByStatus,
    allLeads,
    isLoading,
    isFetching,
  };
}

export type UseKanbanInfiniteQueriesReturn = ReturnType<
  typeof useKanbanInfiniteQueries
>;

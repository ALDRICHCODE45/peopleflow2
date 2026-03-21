import type { CandidateMatchRating } from "@features/vacancy/frontend/types/vacancy.types";

export interface UpsertMatchData {
  candidateId: string;
  checklistItemId: string;
  rating: CandidateMatchRating | null;
  feedback: string | null;
  tenantId: string;
}

export interface CandidateMatchData {
  id: string;
  candidateId: string;
  checklistItemId: string;
  rating: CandidateMatchRating | null;
  feedback: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVacancyCandidateMatchRepository {
  upsert(data: UpsertMatchData): Promise<CandidateMatchData>;
  findByCandidateId(
    candidateId: string,
    tenantId: string
  ): Promise<CandidateMatchData[]>;
  countRatedForCandidate(
    candidateId: string,
    vacancyChecklistItemIds: string[],
    tenantId: string
  ): Promise<number>;
}

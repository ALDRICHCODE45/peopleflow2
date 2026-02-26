export interface UpsertMatchData {
  candidateId: string;
  checklistItemId: string;
  feedback: string | null;
  tenantId: string;
}

export interface CandidateMatchData {
  id: string;
  candidateId: string;
  checklistItemId: string;
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
}

// Vacancy CRUD
export { CreateVacancyUseCase } from "./CreateVacancyUseCase";
export type {
  CreateVacancyInput,
  CreateVacancyOutput,
} from "./CreateVacancyUseCase";

export { UpdateVacancyUseCase } from "./UpdateVacancyUseCase";
export type {
  UpdateVacancyInput,
  UpdateVacancyOutput,
} from "./UpdateVacancyUseCase";

export { DeleteVacancyUseCase } from "./DeleteVacancyUseCase";
export type {
  DeleteVacancyInput,
  DeleteVacancyOutput,
} from "./DeleteVacancyUseCase";

// Vacancy queries
export { GetPaginatedVacanciesUseCase } from "./GetPaginatedVacanciesUseCase";
export type {
  GetPaginatedVacanciesInput,
  GetPaginatedVacanciesOutput,
} from "./GetPaginatedVacanciesUseCase";

export { GetVacancyDetailUseCase } from "./GetVacancyDetailUseCase";
export type {
  GetVacancyDetailInput,
  GetVacancyDetailOutput,
} from "./GetVacancyDetailUseCase";

// Vacancy workflow
export { TransitionVacancyStatusUseCase } from "./TransitionVacancyStatusUseCase";
export type {
  TransitionVacancyStatusInput,
  TransitionVacancyStatusOutput,
} from "./TransitionVacancyStatusUseCase";

export { ValidateTernaUseCase } from "./ValidateTernaUseCase";
export type {
  ValidateTernaInput,
  ValidateTernaOutput,
} from "./ValidateTernaUseCase";

export { ConfirmPlacementUseCase } from "./ConfirmPlacementUseCase";
export type {
  ConfirmPlacementInput,
  ConfirmPlacementOutput,
} from "./ConfirmPlacementUseCase";

// Candidates
export { AddCandidateToVacancyUseCase } from "./AddCandidateToVacancyUseCase";
export type {
  AddCandidateInput,
  AddCandidateToVacancyOutput,
} from "./AddCandidateToVacancyUseCase";

export { UpdateCandidateUseCase } from "./UpdateCandidateUseCase";
export type {
  UpdateCandidateInput,
  UpdateCandidateOutput,
} from "./UpdateCandidateUseCase";

export { RemoveCandidateUseCase } from "./RemoveCandidateUseCase";
export type {
  RemoveCandidateInput,
  RemoveCandidateOutput,
} from "./RemoveCandidateUseCase";

export { SelectFinalistUseCase } from "./SelectFinalistUseCase";
export type {
  SelectFinalistInput,
  SelectFinalistOutput,
} from "./SelectFinalistUseCase";

// Checklist
export { AddChecklistItemUseCase } from "./AddChecklistItemUseCase";
export type {
  AddChecklistItemInput,
  AddChecklistItemOutput,
} from "./AddChecklistItemUseCase";

export { UpdateChecklistItemUseCase } from "./UpdateChecklistItemUseCase";
export type {
  UpdateChecklistItemInput,
  UpdateChecklistItemOutput,
} from "./UpdateChecklistItemUseCase";

export { DeleteChecklistItemUseCase } from "./DeleteChecklistItemUseCase";
export type {
  DeleteChecklistItemInput,
  DeleteChecklistItemOutput,
} from "./DeleteChecklistItemUseCase";

// Candidate match
export { SaveCandidateMatchUseCase } from "./SaveCandidateMatchUseCase";
export type {
  SaveCandidateMatchInput,
  SaveCandidateMatchOutput,
} from "./SaveCandidateMatchUseCase";

// Config
export { GetVacancyConfigUseCase } from "./GetVacancyConfigUseCase";
export type {
  GetVacancyConfigInput,
  GetVacancyConfigOutput,
} from "./GetVacancyConfigUseCase";

export { UpsertVacancyConfigUseCase } from "./UpsertVacancyConfigUseCase";
export type {
  UpsertVacancyConfigInput,
  UpsertVacancyConfigOutput,
} from "./UpsertVacancyConfigUseCase";

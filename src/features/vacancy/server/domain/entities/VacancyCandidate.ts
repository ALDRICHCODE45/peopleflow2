import type {
  VacancyCandidateDTO,
  VacancyModality,
  CandidateStatus,
} from "@features/vacancy/frontend/types/vacancy.types";

export interface VacancyCandidateProps {
  id: string;
  vacancyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isCurrentlyEmployed: boolean | null;
  currentCompany: string | null;
  currentSalary: number | null;
  salaryExpectation: number | null;
  currentModality: VacancyModality | null;
  countryCode: string | null;
  regionCode: string | null;
  currentCommissions: string | null;
  currentBenefits: string | null;
  otherBenefits: string | null;
  status: CandidateStatus;
  isInTerna: boolean;
  isFinalist: boolean;
  finalSalary: number | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VacancyCandidate {
  private readonly props: VacancyCandidateProps;

  constructor(props: VacancyCandidateProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get vacancyId(): string {
    return this.props.vacancyId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get isCurrentlyEmployed(): boolean | null {
    return this.props.isCurrentlyEmployed;
  }

  get currentCompany(): string | null {
    return this.props.currentCompany;
  }

  get currentSalary(): number | null {
    return this.props.currentSalary;
  }

  get salaryExpectation(): number | null {
    return this.props.salaryExpectation;
  }

  get currentModality(): VacancyModality | null {
    return this.props.currentModality;
  }

  get countryCode(): string | null {
    return this.props.countryCode;
  }

  get regionCode(): string | null {
    return this.props.regionCode;
  }

  get currentCommissions(): string | null {
    return this.props.currentCommissions;
  }

  get currentBenefits(): string | null {
    return this.props.currentBenefits;
  }

  get otherBenefits(): string | null {
    return this.props.otherBenefits;
  }

  get status(): CandidateStatus {
    return this.props.status;
  }

  get isInTerna(): boolean {
    return this.props.isInTerna;
  }

  get isFinalist(): boolean {
    return this.props.isFinalist;
  }

  get finalSalary(): number | null {
    return this.props.finalSalary;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Métodos de dominio ---

  /** Retorna el nombre completo del candidato */
  getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  /** Retorna true si el candidato tiene al menos nombre y apellido definidos */
  hasMinimumProfile(): boolean {
    return (
      this.props.firstName.trim().length > 0 &&
      this.props.lastName.trim().length > 0
    );
  }

  /** Retorna true si el candidato puede ser seleccionado para la terna */
  isEligibleForTerna(): boolean {
    return (
      this.props.status === "EN_PROCESO" || this.props.status === "EN_TERNA"
    );
  }

  /** Retorna true si el candidato puede ser marcado como finalista */
  canBeFinalist(): boolean {
    return this.props.isInTerna === true;
  }

  toJSON(): VacancyCandidateDTO {
    return {
      id: this.props.id,
      vacancyId: this.props.vacancyId,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      email: this.props.email,
      phone: this.props.phone,
      isCurrentlyEmployed: this.props.isCurrentlyEmployed,
      currentCompany: this.props.currentCompany,
      currentSalary: this.props.currentSalary,
      salaryExpectation: this.props.salaryExpectation,
      currentModality: this.props.currentModality,
      countryCode: this.props.countryCode,
      regionCode: this.props.regionCode,
      currentCommissions: this.props.currentCommissions,
      currentBenefits: this.props.currentBenefits,
      otherBenefits: this.props.otherBenefits,
      status: this.props.status,
      isInTerna: this.props.isInTerna,
      isFinalist: this.props.isFinalist,
      finalSalary: this.props.finalSalary,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

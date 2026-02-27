export interface TernaHistoryCandidateProps {
  id: string;
  ternaHistoryId: string;
  candidateId: string;
  candidateFullName: string;
  tenantId: string;
}

export interface VacancyTernaHistoryProps {
  id: string;
  vacancyId: string;
  ternaNumber: number;
  validatedAt: Date;
  validatedById: string;
  validatedByName?: string | null;
  targetDeliveryDate: Date | null;
  isOnTime: boolean;
  tenantId: string;
  createdAt: Date;
  candidates: TernaHistoryCandidateProps[];
}

export class VacancyTernaHistory {
  constructor(private readonly props: VacancyTernaHistoryProps) {}

  get id() { return this.props.id; }
  get vacancyId() { return this.props.vacancyId; }
  get ternaNumber() { return this.props.ternaNumber; }
  get validatedAt() { return this.props.validatedAt; }
  get validatedById() { return this.props.validatedById; }
  get validatedByName() { return this.props.validatedByName; }
  get targetDeliveryDate() { return this.props.targetDeliveryDate; }
  get isOnTime() { return this.props.isOnTime; }
  get tenantId() { return this.props.tenantId; }
  get createdAt() { return this.props.createdAt; }
  get candidates() { return this.props.candidates; }

  toJSON() {
    return {
      id: this.props.id,
      vacancyId: this.props.vacancyId,
      ternaNumber: this.props.ternaNumber,
      validatedAt: this.props.validatedAt.toISOString(),
      validatedById: this.props.validatedById,
      validatedByName: this.props.validatedByName ?? null,
      targetDeliveryDate: this.props.targetDeliveryDate?.toISOString() ?? null,
      isOnTime: this.props.isOnTime,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      candidates: this.props.candidates,
    };
  }
}

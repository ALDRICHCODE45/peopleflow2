import type {
  VacancyDTO,
  VacancyStatusType,
  VacancySaleType,
  VacancyServiceType,
  VacancyModality,
  VacancyCurrency,
  VacancyCandidateDTO,
  VacancyChecklistItemDTO,
  VacancyStatusHistoryDTO,
} from "@features/vacancy/frontend/types/vacancy.types";
import { VacancyStatusVO } from "../value-objects/VacancyStatus";

export interface VacancyProps {
  id: string;
  position: string;
  status: VacancyStatusType;
  recruiterId: string;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterAvatar?: string | null;
  clientId: string;
  clientName?: string | null;
  saleType: VacancySaleType;
  serviceType: VacancyServiceType;
  currency: VacancyCurrency | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: "FIXED" | "RANGE" | null;
  salaryFixed: number | null;
  commissions: string | null;
  benefits: string | null;
  tools: string | null;
  modality: VacancyModality | null;
  schedule: string | null;
  countryCode: string | null;
  regionCode: string | null;
  requiresPsychometry: boolean;
  checklistValidatedAt: Date | null;
  checklistValidatedById: string | null;
  checklistRejectionReason: string | null;
  assignedAt: Date;
  currentCycleStartedAt: Date;
  targetDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  entryDate: Date | null;
  rollbackCount: number;
  placementConfirmedAt: Date | null;
  commissionDate: Date | null;
  congratsEmailSent: boolean;
  // Candidato contratado (FK directa)
  hiredCandidateId: string | null;
  hiredCandidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  tenantId: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Warranty (Garantía)
  isWarranty: boolean;
  originVacancyId: string | null;
  warrantyVacancyId: string | null;
  // Client metadata (loaded via join)
  clientWarrantyMonths?: number | null;
  // Relaciones opcionales — se populan solo en consultas de detalle
  candidates?: VacancyCandidateDTO[];
  checklistItems?: VacancyChecklistItemDTO[];
  statusHistory?: VacancyStatusHistoryDTO[];
}

export class Vacancy {
  private readonly props: VacancyProps;

  constructor(props: VacancyProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get position(): string {
    return this.props.position;
  }

  get status(): VacancyStatusType {
    return this.props.status;
  }

  get recruiterId(): string {
    return this.props.recruiterId;
  }

  get recruiterName(): string | null | undefined {
    return this.props.recruiterName;
  }

  get recruiterEmail(): string | null | undefined {
    return this.props.recruiterEmail;
  }

  get recruiterAvatar(): string | null | undefined {
    return this.props.recruiterAvatar;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get clientName(): string | null | undefined {
    return this.props.clientName;
  }

  get saleType(): VacancySaleType {
    return this.props.saleType;
  }

  get serviceType(): VacancyServiceType {
    return this.props.serviceType;
  }

  get currency(): VacancyCurrency | null {
    return this.props.currency;
  }

  get salaryMin(): number | null {
    return this.props.salaryMin;
  }

  get salaryMax(): number | null {
    return this.props.salaryMax;
  }

  get salaryType(): "FIXED" | "RANGE" | null {
    return this.props.salaryType;
  }

  get salaryFixed(): number | null {
    return this.props.salaryFixed;
  }

  get commissions(): string | null {
    return this.props.commissions;
  }

  get benefits(): string | null {
    return this.props.benefits;
  }

  get tools(): string | null {
    return this.props.tools;
  }

  get modality(): VacancyModality | null {
    return this.props.modality;
  }

  get schedule(): string | null {
    return this.props.schedule;
  }

  get countryCode(): string | null {
    return this.props.countryCode;
  }

  get regionCode(): string | null {
    return this.props.regionCode;
  }

  get requiresPsychometry(): boolean {
    return this.props.requiresPsychometry;
  }

  get checklistValidatedAt(): Date | null {
    return this.props.checklistValidatedAt;
  }

  get checklistValidatedById(): string | null {
    return this.props.checklistValidatedById;
  }

  get checklistRejectionReason(): string | null {
    return this.props.checklistRejectionReason;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get currentCycleStartedAt(): Date {
    return this.props.currentCycleStartedAt;
  }

  get targetDeliveryDate(): Date | null {
    return this.props.targetDeliveryDate;
  }

  get actualDeliveryDate(): Date | null {
    return this.props.actualDeliveryDate;
  }

  get entryDate(): Date | null {
    return this.props.entryDate;
  }

  get rollbackCount(): number {
    return this.props.rollbackCount;
  }

  get placementConfirmedAt(): Date | null {
    return this.props.placementConfirmedAt;
  }

  get commissionDate(): Date | null {
    return this.props.commissionDate;
  }

  get congratsEmailSent(): boolean {
    return this.props.congratsEmailSent;
  }

  get hiredCandidateId(): string | null {
    return this.props.hiredCandidateId;
  }

  get hiredCandidate(): { id: string; firstName: string; lastName: string; email: string | null; } | null {
    return this.props.hiredCandidate ?? null;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdById(): string | null {
    return this.props.createdById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isWarranty(): boolean {
    return this.props.isWarranty;
  }

  get originVacancyId(): string | null {
    return this.props.originVacancyId;
  }

  get warrantyVacancyId(): string | null {
    return this.props.warrantyVacancyId;
  }

  get clientWarrantyMonths(): number | null {
    return this.props.clientWarrantyMonths ?? null;
  }

  // --- Métodos de dominio ---

  /**
   * Readiness for Hunting is now evaluated by the VacancyStateMachine guards (attachment checks,
   * checklist validation). This method is kept for backward compatibility but always returns true.
   * @deprecated Use VacancyStateMachine.evaluateTransition() instead.
   */
  isReadyForHunting(): boolean {
    return true;
  }

  /**
   * Retorna el estado SLA de la vacante:
   * - PENDING: no hay fecha de entrega real (actualDeliveryDate)
   * - GREEN: entregada a tiempo (actualDeliveryDate <= targetDeliveryDate)
   * - RED: entregada tarde (actualDeliveryDate > targetDeliveryDate)
   */
  getSlaStatus(): "GREEN" | "RED" | "PENDING" {
    if (!this.props.actualDeliveryDate) {
      return "PENDING";
    }
    if (!this.props.targetDeliveryDate) {
      return "PENDING";
    }
    return this.props.actualDeliveryDate <= this.props.targetDeliveryDate
      ? "GREEN"
      : "RED";
  }

  /**
   * Días transcurridos desde assignedAt hasta placementConfirmedAt o hasta ahora.
   */
  getTotalElapsedDays(): number {
    const end = this.props.placementConfirmedAt ?? new Date();
    const diffMs = end.getTime() - this.props.assignedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Retorna true si la vacante puede hacer rollback (volver a HUNTING).
   * Solo desde FOLLOW_UP o PRE_PLACEMENT.
   */
  canRollback(): boolean {
    return (
      this.props.status === "FOLLOW_UP" ||
      this.props.status === "PRE_PLACEMENT"
    );
  }

  /**
   * Retorna true si la vacante está lista para Validar Terna (→ FOLLOW_UP).
   * Requiere estar en estado HUNTING.
   */
  canValidateTerna(): boolean {
    return this.props.status === "HUNTING";
  }

  /**
   * Retorna true si la vacante puede ser editada.
   * No se puede editar si está en PLACEMENT, CANCELADA o PERDIDA.
   */
  canEdit(): boolean {
    return (
      this.props.status !== "PLACEMENT" &&
      this.props.status !== "CANCELADA" &&
      this.props.status !== "PERDIDA"
    );
  }

  /**
   * Retorna true si la vacante puede tener una garantía aplicada.
   * Solo vacantes en estado PLACEMENT pueden generar garantía.
   */
  canApplyWarranty(): boolean {
    return this.props.status === "PLACEMENT" && !this.props.isWarranty;
  }

  /**
   * Retorna true si la garantía de la vacante ya expiró.
   * Calcula si la fecha actual >= placementConfirmedAt + warrantyMonths.
   *
   * Edge cases:
   * - placementConfirmedAt null → expired (no date to calculate from)
   * - warrantyMonths <= 0 → NOT expired (no warranty configured, allow with warning)
   */
  isWarrantyExpired(warrantyMonths: number): boolean {
    // No placement date → treat as expired
    if (!this.props.placementConfirmedAt) return true;

    // No warranty configured (0 or negative) → not expired (allow with warning upstream)
    if (warrantyMonths <= 0) return false;

    const expiryDate = new Date(this.props.placementConfirmedAt);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

    return new Date() >= expiryDate;
  }

  /**
   * Delega al VacancyStatusVO para obtener las transiciones válidas desde el estado actual.
   */
  getValidTransitions(): VacancyStatusType[] {
    const statusVO = VacancyStatusVO.create(this.props.status);
    return statusVO.getValidTransitions();
  }

  /**
   * Delega al VacancyStatusVO para determinar si la transición requiere motivo.
   */
  requiresReasonForTransition(newStatus: VacancyStatusType): boolean {
    const statusVO = VacancyStatusVO.create(this.props.status);
    return statusVO.requiresReason(newStatus);
  }

  toJSON(): VacancyDTO {
    return {
      id: this.props.id,
      position: this.props.position,
      status: this.props.status,
      recruiterId: this.props.recruiterId,
      recruiterName: this.props.recruiterName ?? null,
      recruiterEmail: this.props.recruiterEmail ?? null,
      recruiterAvatar: this.props.recruiterAvatar ?? null,
      clientId: this.props.clientId,
      clientName: this.props.clientName ?? null,
      saleType: this.props.saleType,
      serviceType: this.props.serviceType,
      currency: this.props.currency,
      salaryMin: this.props.salaryMin,
      salaryMax: this.props.salaryMax,
      salaryType: this.props.salaryType ?? "RANGE",
      salaryFixed: this.props.salaryFixed,
      commissions: this.props.commissions,
      benefits: this.props.benefits,
      tools: this.props.tools,
      modality: this.props.modality,
      schedule: this.props.schedule,
      countryCode: this.props.countryCode,
      regionCode: this.props.regionCode,
      requiresPsychometry: this.props.requiresPsychometry,
      checklistValidatedAt: this.props.checklistValidatedAt?.toISOString() ?? null,
      checklistValidatedById: this.props.checklistValidatedById,
      checklistRejectionReason: this.props.checklistRejectionReason,
      assignedAt: this.props.assignedAt.toISOString(),
      currentCycleStartedAt: this.props.currentCycleStartedAt.toISOString(),
      targetDeliveryDate: this.props.targetDeliveryDate?.toISOString() ?? null,
      actualDeliveryDate:
        this.props.actualDeliveryDate?.toISOString() ?? null,
      entryDate: this.props.entryDate?.toISOString() ?? null,
      rollbackCount: this.props.rollbackCount,
      placementConfirmedAt:
        this.props.placementConfirmedAt?.toISOString() ?? null,
      commissionDate: this.props.commissionDate?.toISOString() ?? null,
      congratsEmailSent: this.props.congratsEmailSent,
      tenantId: this.props.tenantId,
      createdById: this.props.createdById,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      isWarranty: this.props.isWarranty,
      originVacancyId: this.props.originVacancyId,
      warrantyVacancyId: this.props.warrantyVacancyId,
      candidates: this.props.candidates,
      checklistItems: this.props.checklistItems,
      statusHistory: this.props.statusHistory,
    };
  }
}

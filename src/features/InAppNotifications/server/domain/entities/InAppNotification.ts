export type InAppNotificationType =
  | "VACANCY_ATTACHMENT_REJECTED"
  | "VACANCY_CHECKLIST_REJECTED"
  | "TERNA_VALIDATION_PENDING"
  | "VACANCY_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_INACTIVE"
  | "VACANCY_STALE"
  | "VACANCY_COUNTDOWN"
  | "COMMITMENT_MORNING_REMINDER"
  | "COMMITMENT_EVENING_ADMIN_REPORT";

export interface InAppNotificationProps {
  id: string;
  tenantId: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  triggeredByUserId: string | null;
  triggeredBy?: TriggeredByActorDTO | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TriggeredByActorDTO {
  id: string;
  name: string | null;
  image: string | null;
}

export interface InAppNotificationDTO {
  id: string;
  tenantId: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  readAt: string | null;
  archivedAt: string | null;
  triggeredByUserId: string | null;
  triggeredBy: TriggeredByActorDTO | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class InAppNotification {
  private readonly props: InAppNotificationProps;

  constructor(props: InAppNotificationProps) {
    this.validateRequired(props);
    this.props = props;
  }

  private validateRequired(props: InAppNotificationProps): void {
    if (!props.id || !props.tenantId || !props.userId) {
      throw new Error("InAppNotification inválida: faltan IDs requeridos");
    }

    if (!props.title.trim() || !props.body.trim()) {
      throw new Error("InAppNotification inválida: título y cuerpo son requeridos");
    }
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): InAppNotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get resourceType(): string | null {
    return this.props.resourceType;
  }

  get resourceId(): string | null {
    return this.props.resourceId;
  }

  get actionUrl(): string | null {
    return this.props.actionUrl;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt;
  }

  get triggeredByUserId(): string | null {
    return this.props.triggeredByUserId;
  }

  get triggeredBy(): TriggeredByActorDTO | null {
    return this.props.triggeredBy ?? null;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isRead(): boolean {
    return !!this.props.readAt;
  }

  isArchived(): boolean {
    return !!this.props.archivedAt;
  }

  toJSON(): InAppNotificationDTO {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      userId: this.props.userId,
      type: this.props.type,
      title: this.props.title,
      body: this.props.body,
      resourceType: this.props.resourceType,
      resourceId: this.props.resourceId,
      actionUrl: this.props.actionUrl,
      readAt: this.props.readAt?.toISOString() ?? null,
      archivedAt: this.props.archivedAt?.toISOString() ?? null,
      triggeredByUserId: this.props.triggeredByUserId,
      triggeredBy: this.props.triggeredBy ?? null,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}

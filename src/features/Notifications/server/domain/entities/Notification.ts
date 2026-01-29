export type NotificationStatus = "PENDING" | "SENDING" | "SENT" | "FAILED";
export type NotificationProvider = "EMAIL" | "TELEGRAM" | "WHATSAPP" | "SMS";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NotificationProps {
  id: string;
  tenantId: string;
  provider: NotificationProvider;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipient: string;
  subject: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDTO {
  id: string;
  tenantId: string;
  provider: NotificationProvider;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipient: string;
  subject: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  private readonly props: NotificationProps;

  constructor(props: NotificationProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get provider(): NotificationProvider {
    return this.props.provider;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  get priority(): NotificationPriority {
    return this.props.priority;
  }

  get recipient(): string {
    return this.props.recipient;
  }

  get subject(): string | null {
    return this.props.subject;
  }

  get body(): string {
    return this.props.body;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get sentAt(): Date | null {
    return this.props.sentAt;
  }

  get failedAt(): Date | null {
    return this.props.failedAt;
  }

  get error(): string | null {
    return this.props.error;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get maxRetries(): number {
    return this.props.maxRetries;
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

  canRetry(): boolean {
    return (
      this.props.status === "FAILED" &&
      this.props.retryCount < this.props.maxRetries
    );
  }

  isPending(): boolean {
    return this.props.status === "PENDING";
  }

  isSent(): boolean {
    return this.props.status === "SENT";
  }

  isFailed(): boolean {
    return this.props.status === "FAILED";
  }

  toJSON(): NotificationDTO {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      provider: this.props.provider,
      status: this.props.status,
      priority: this.props.priority,
      recipient: this.props.recipient,
      subject: this.props.subject,
      body: this.props.body,
      metadata: this.props.metadata,
      sentAt: this.props.sentAt,
      failedAt: this.props.failedAt,
      error: this.props.error,
      retryCount: this.props.retryCount,
      maxRetries: this.props.maxRetries,
      createdById: this.props.createdById,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

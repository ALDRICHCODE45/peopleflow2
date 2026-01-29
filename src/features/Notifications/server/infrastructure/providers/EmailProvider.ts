import nodemailer from "nodemailer";
import type {
  INotificationProvider,
  SendResult,
} from "../../domain/interfaces/INotificationProvider";
import type {
  Notification,
  NotificationProvider,
} from "../../domain/entities/Notification";

export class EmailProvider implements INotificationProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  supports(provider: NotificationProvider): boolean {
    return provider === "EMAIL";
  }

  async send(notification: Notification): Promise<SendResult> {
    try {
      const metadata = (notification.metadata || {}) as Record<string, unknown>;

      // Determinar contenido HTML: usar htmlTemplate si existe, o body si html es true
      const htmlContent = metadata.htmlTemplate
        ? (metadata.htmlTemplate as string)
        : metadata.html
          ? notification.body
          : undefined;

      const info = await this.transporter.sendMail({
        from:
          (metadata.from as string) ||
          process.env.SMTP_FROM ||
          "noreply@peopleflow.com",
        to: notification.recipient,
        subject: notification.subject || "Notificacion de PeopleFlow",
        text: notification.body,
        html: htmlContent,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP connection verification failed:", error);
      return false;
    }
  }
}

export const emailProvider = new EmailProvider();

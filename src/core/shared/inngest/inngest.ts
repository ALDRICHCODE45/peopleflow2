import { Inngest, EventSchemas } from "inngest";

export type StandaloneEmailPayload =
  | {
      template: "recruiter-vacancy-assigned";
      tenantId: string;
      triggeredById: string;
      data: {
        recruiterName: string;
        recruiterEmail: string;
        vacancyPosition: string;
        clientName: string;
        vacancyId: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "attachment-rejected";
      tenantId: string;
      triggeredById: string;
      data: {
        recruiterName: string;
        recruiterEmail: string;
        vacancyPosition: string;
        clientName: string;
        fileName: string;
        rejectionReason: string;
        vacancyId: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "checklist-rejected";
      tenantId: string;
      triggeredById: string;
      data: {
        recruiterName: string;
        recruiterEmail: string;
        vacancyPosition: string;
        clientName: string;
        rejectionReason: string;
        vacancyId: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "vacancy-status-hunting";
      tenantId: string;
      triggeredById: string;
      data: {
        recruiterName: string;
        recruiterEmail: string;
        vacancyPosition: string;
        clientName: string;
        vacancyId: string;
      };
    }
  | {
      template: "vacancy-status-follow-up";
      tenantId: string;
      triggeredById: string;
      data: {
        recruiterName: string;
        recruiterEmail: string;
        vacancyPosition: string;
        clientName: string;
        vacancyId: string;
      };
    }
   | {
      template: "validation-request";
      tenantId: string;
      triggeredById: string;
      data: {
        recipientName: string;
        recipientEmail: string;
        requesterName: string;
        vacancyPosition: string;
        clientName: string;
        resources: string[];
        vacancyId: string;
        tenantName: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "vacancy-countdown";
      tenantId: string;
      triggeredById: string;
      data: {
        recipientName: string;
        recipientEmail: string;
        vacancyPosition: string;
        clientName: string;
        daysRemaining: number;
        targetDate: string;
        vacancyId: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "vacancy-stale-alert";
      tenantId: string;
      triggeredById: string;
      data: {
        recipientName: string;
        recipientEmail: string;
        vacancyPosition: string;
        clientName: string;
        currentStatus: string;
        daysInStatus: number;
        tenantName: string;
        vacancyId: string;
        recipientUserId?: string;
      };
    }
  | {
      template: "password-change-campaign";
      // Tenant del destinatario para auditoria (Notification.tenantId).
      // Para envios de prueba sin destinatario real del sistema, isTest=true y
      // tenantId apunta al tenant del super-admin que disparo el envio.
      tenantId: string;
      triggeredById: string;
      data: {
        recipientName: string | null;
        recipientEmail: string;
        // isTest=true marca explicitamente que es un envio de prueba (para logs/auditoria)
        isTest: boolean;
      };
    };

type Events = {
  "lead/status.changed": {
    data: {
      leadId: string;
      tenantId: string;
      oldStatus: string;
      newStatus: string;
      companyName: string;
      assignedToId: string | null;
      changedById: string;
    };
  };
  "vacancy/pre-placement.entered": {
    data: {
      vacancyId: string;
      tenantId: string;
      recruiterId: string;
      vacancyPosition: string;
      entryDate: string; // ISO string
    };
  };
  "vacancy/placement.congrats-email": {
    data: {
      vacancyId: string;
      tenantId: string;
      vacancyPosition: string;
      candidateName: string;
      candidateEmail: string | null;
    };
  };
  "vacancy/countdown.schedule": {
    data: {
      vacancyId: string;
      tenantId: string;
      targetDeliveryDate: string; // ISO
      vacancyPosition: string;
      clientName: string;
      recruiterId: string;
      recruiterName: string;
      recruiterEmail: string;
    };
  };
  "vacancy/status.changed": {
    data: {
      vacancyId: string;
      tenantId: string;
      oldStatus: string;
      newStatus: string;
      vacancyPosition: string;
      clientName: string;
      recruiterId: string;
      recruiterName: string;
      recruiterEmail: string;
    };
  };
  "email/send": {
    data: StandaloneEmailPayload;
  };
  "commitment/meeting-report.requested": {
    data: {
      tenantId: string;
      triggeredByUserId: string;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "PeopleFlow-ERP-App",
  name: "ERP APP",
  schemas: new EventSchemas().fromRecord<Events>(),
});

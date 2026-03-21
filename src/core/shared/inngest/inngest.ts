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
  "email/send": {
    data: StandaloneEmailPayload;
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "PeopleFlow-ERP-App",
  name: "ERP APP",
  schemas: new EventSchemas().fromRecord<Events>(),
});

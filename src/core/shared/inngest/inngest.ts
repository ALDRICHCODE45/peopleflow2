import { Inngest, EventSchemas } from "inngest";

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
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "PeopleFlow-ERP-App",
  name: "ERP APP",
  schemas: new EventSchemas().fromRecord<Events>(),
});

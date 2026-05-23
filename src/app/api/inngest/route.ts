import { inngest } from "@core/shared/inngest/inngest";
import { functions } from "@core/shared/inngest/registry";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});

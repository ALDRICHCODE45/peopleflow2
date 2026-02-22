import { functions } from "@/core/shared/inngest/functions";
import { serve } from "inngest/next";
import { inngest } from "@core/shared/inngest/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});

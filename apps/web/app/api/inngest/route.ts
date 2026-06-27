import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

/**
 * Inngest serve-endepunkt. Lokalt: kjør `npx inngest-cli@latest dev` og åpne
 * dashboardet på http://localhost:8288. Se docs/CONTENT-RADAR.md.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});

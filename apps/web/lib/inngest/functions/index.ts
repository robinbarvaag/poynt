import { radarAnalyze } from "./radar-analyze";
import { radarHeartbeat } from "./radar-heartbeat";

/** Alle Inngest-funksjoner som serves på /api/inngest. */
export const functions = [radarHeartbeat, radarAnalyze];

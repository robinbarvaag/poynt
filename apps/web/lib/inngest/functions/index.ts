import { bookStockSnapshot } from "./book-stock";
import { eventPayments } from "./event-payments";
import { eventReminders } from "./event-reminders";
import { eventRetention } from "./event-retention";
import { inspirationFetch } from "./inspiration-fetch";
import { radarAnalyze } from "./radar-analyze";
import { radarHeartbeat } from "./radar-heartbeat";

/** Alle Inngest-funksjoner som serves på /api/inngest. */
export const functions = [
  radarHeartbeat,
  radarAnalyze,
  inspirationFetch,
  eventRetention,
  eventReminders,
  eventPayments,
  bookStockSnapshot,
];

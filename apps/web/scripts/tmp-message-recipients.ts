/**
 * MIDLERTIDIG (ikke commit): tell mottakere for beskjed til påmeldte på
 * testeventet. Sender INGENTING og logger bare antall.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-message-recipients.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { getMessageRecipients } from "../lib/events/messages";

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "events",
  where: { slug: { equals: "testevent-e2e" } },
  limit: 1,
  depth: 0,
});
if (!docs[0]) process.exit(1);

for (const audience of ["tickets", "waitlisted", "all"] as const) {
  const found = await getMessageRecipients(docs[0].id, audience);
  payload.logger.info(
    `${audience}: ${found?.recipients.length} mottakere, alle med billettlenke: ${found?.recipients.every((r) => r.ticketUrl?.includes("/eventer/billett/"))}`
  );
}
process.exit(0);

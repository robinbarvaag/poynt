/**
 * Henter lagerstatus for boka nå, uten å vente på cron. Samme kode som
 * Inngest-jobben kjører hver morgen — nyttig for å teste en ny kilde eller
 * fylle inn et døgn som ble hoppet over.
 *
 *   bun run --cwd apps/web payload run scripts/fetch-book-stock.ts [kilde]
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { runStockSnapshot } from "../lib/boksalg/snapshot";

const payload = await getPayload({ config });
const args = process.argv.slice(2);
const force = args.includes("--force");
const sourceKey = args.find((arg) => !arg.startsWith("--"));

// --force henter selv om kilden ble hentet nylig (gjelder kilder med minIntervalMs).
const result = await runStockSnapshot(payload, { sourceKey, force });

console.log(`\nISBN ${result.isbn}`);
for (const source of result.sources) {
  if (!source.ok) {
    console.log(
      `  ${source.sourceKey}: ${source.transient ? "UTILGJENGELIG" : "FEIL"} — ${source.error}`
    );
    continue;
  }
  if (source.skipped) {
    console.log(
      `  ${source.sourceKey}: hoppet over — hentet for ${source.lastFetchedMinutesAgo} min siden (bruk --force)`
    );
    continue;
  }
  console.log(
    `  ${source.sourceKey}: ${source.online} · ${source.storesWithStock} butikker med boka · ${source.totalCopies} eksemplarer · ${source.events} endringer (${source.estimatedSales} estimerte salg)`
  );
}

process.exit(0);

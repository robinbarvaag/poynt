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
const sourceKey = process.argv[2];

const result = await runStockSnapshot(payload, { sourceKey });

console.log(`\nISBN ${result.isbn}`);
for (const source of result.sources) {
  if (!source.ok) {
    console.log(`  ${source.sourceKey}: FEIL — ${source.error}`);
    continue;
  }
  console.log(
    `  ${source.sourceKey}: ${source.online} · ${source.storesWithStock} butikker med boka · ${source.totalCopies} eksemplarer · ${source.events} endringer (${source.estimatedSales} estimerte salg)`
  );
}

process.exit(0);

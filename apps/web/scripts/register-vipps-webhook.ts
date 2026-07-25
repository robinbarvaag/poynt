/**
 * Registrerer webhook-endepunktet vårt hos Vipps og skriv ut secreten som må
 * inn i VIPPS_WEBHOOK_SECRET. Secreten visast BERRE ved registrering — mistar
 * du han, slett webhooken og registrer på nytt.
 *
 *   cd apps/web && bun scripts/register-vipps-webhook.ts [url]
 *
 * Utan argument brukast NEXT_PUBLIC_URL + /api/webhooks/vipps. Vipps krev ein
 * offentleg https-URL — for lokal testing, bruk ein tunnel (t.d. ngrok) og
 * send tunnel-URL-en som argument. Kjør scriptet på nytt utan endringar for å
 * liste eksisterande webhooks.
 */
import { getVippsAccessToken } from "../lib/vipps";

const API_URL = process.env.VIPPS_API_URL || "https://apitest.vipps.no";
const MSN = process.env.VIPPS_MSN;
const SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY;

if (!MSN || !SUBSCRIPTION_KEY) {
  console.error("VIPPS_MSN og VIPPS_SUBSCRIPTION_KEY må vere satt");
  process.exit(1);
}

const url =
  process.argv[2] ?? `${process.env.NEXT_PUBLIC_URL}/api/webhooks/vipps`;

if (!url.startsWith("https://")) {
  console.error(
    `Vipps krev https-URL, fekk: ${url} — bruk ein tunnel for lokal testing`
  );
  process.exit(1);
}

const token = await getVippsAccessToken();
const headers = {
  Authorization: `Bearer ${token}`,
  "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
  "Merchant-Serial-Number": MSN,
  "Content-Type": "application/json",
};

// Vis eksisterande webhooks fyrst, så vi ikkje registrerer duplikat.
const listRes = await fetch(`${API_URL}/webhooks/v1/webhooks`, { headers });
if (!listRes.ok) {
  console.error(`Klarte ikkje liste webhooks: ${listRes.status}`);
  console.error(await listRes.text());
  process.exit(1);
}
const existing = (await listRes.json()) as {
  webhooks?: { id: string; url: string; events: string[] }[];
};

for (const hook of existing.webhooks ?? []) {
  console.log(`Eksisterande webhook: ${hook.url} (id: ${hook.id})`);
  if (hook.url === url) {
    console.log(
      `→ Denne URL-en er allereie registrert. Secreten kan ikkje hentast på nytt — slett webhooken i så fall med:
  curl -X DELETE ${API_URL}/webhooks/v1/webhooks/${hook.id} \\
    -H "Authorization: Bearer <token>" -H "Ocp-Apim-Subscription-Key: ..." -H "Merchant-Serial-Number: ${MSN}"`
    );
    process.exit(0);
  }
}

const res = await fetch(`${API_URL}/webhooks/v1/webhooks`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    url,
    events: [
      "epayments.payment.authorized.v1",
      "epayments.payment.aborted.v1",
      "epayments.payment.expired.v1",
      "epayments.payment.cancelled.v1",
      "epayments.payment.terminated.v1",
    ],
  }),
});

if (!res.ok) {
  console.error(`Registrering feila: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const data = (await res.json()) as { id: string; secret: string };
console.log(`✅ Webhook registrert: ${url}`);
console.log(`   id: ${data.id}`);
console.log("");
console.log("Legg denne i apps/web/.env.local (og i prod-miljøet):");
console.log(`VIPPS_WEBHOOK_SECRET=${data.secret}`);

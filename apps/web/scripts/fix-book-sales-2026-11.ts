/**
 * Andre avstemming av Boksalg mot Forlagssentralen (ordresøk 05.11.2026,
 * ordredato 01.01.–05.11.2026, ISBN 9788230375334).
 *
 * Kontert per kjede: Norli 373 (inkl. 60 på Pottemakerveien), ARK 307,
 * Biblioteksentralen 11, Akademika Stavanger 2, Poynt AS 20 + 1 under
 * produksjon. Boksalg hadde Norli 360, ARK 303, bibliotek 8 og Akademika på
 * «annet». Se docs/BOKSALG.md, «Forlagssentralen er fasiten for innkjøp».
 *
 * Poynt AS (kunde 906029) føres IKKE: det er Susannes eget uttak —
 * nettbutikk-forsendelser (telles allerede fra `orders`), gaver og skadde
 * bøker. Det hører hjemme i opplagskontrollen, ikke i salget.
 *
 * Kan kjøres flere ganger: endringer finner raden på innhold og hopper over
 * når den allerede er rettet, nye rader lages bare når referansen mangler.
 *
 * Krever migrasjonen `akademika_kanal` først (bun run payload:migrate).
 *
 *   # Tørrkjøring — viser hva som ville blitt gjort, skriver ingenting
 *   bun run --cwd apps/web payload run scripts/fix-book-sales-2026-11.ts
 *
 *   # Gjør endringene
 *   bun run --cwd apps/web payload run scripts/fix-book-sales-2026-11.ts apply
 */
import { dayKey } from "@/lib/boksalg/dates";
import type { BookSale } from "@/payload-types";
import config from "@payload-config";
import { getPayload } from "payload";

type Channel = BookSale["channel"];
type Source = BookSale["saleSource"];

interface Match {
  day: string;
  copies: number;
  channel: Channel;
  saleSource: Source;
}

interface Change {
  label: string;
  before: Match;
  after: Partial<
    Pick<BookSale, "copies" | "channel" | "saleSource" | "reference" | "notes">
  >;
}

const REPORT = "Forlagssentralen, ordresøk 05.11.2026";
/** Rapporten viser ikke ordredato — radene dateres til rapportdagen. */
const REPORT_DAY = "2026-11-05T00:00:00.000Z";

const CHANGES: Change[] = [
  {
    label: "Forhåndssalg Pottemakerveien 56 → 60",
    before: {
      day: "2026-09-22",
      copies: 56,
      channel: "norli",
      saleSource: "forhandssalg",
    },
    after: {
      copies: 60,
      notes: `Norli oppgir 94 kundebestillinger via bok.norli.no. ${REPORT}: 60 kontert på kunde 1654 (fire av dem med ordredato før 01.09). Resten føres når kunde 1654 øker i «Kontert».`,
    },
  },
  {
    label: "Akademika: «annet»/direkte → egen kanal, innkjøp",
    before: {
      day: "2026-10-25",
      copies: 2,
      channel: "annet",
      saleSource: "direkte",
    },
    after: {
      channel: "akademika",
      saleSource: "innkjop",
      reference: "FS 4286 Akademika Stavanger",
      notes: `${REPORT}: 2 kontert på kunde 4286.`,
    },
  },
];

const NEW_ROWS: { channel: Channel; copies: number; reference: string }[] = [
  { channel: "norli", copies: 1, reference: "FS 558 Norli Universitetsgata" },
  { channel: "norli", copies: 1, reference: "FS 1457 Norli Ski" },
  { channel: "norli", copies: 1, reference: "FS 1872 Norli Trekanten Senter" },
  { channel: "norli", copies: 1, reference: "FS 2017 Norli CC-Vest" },
  { channel: "norli", copies: 1, reference: "FS 2019 Norli Oslo City" },
  { channel: "norli", copies: 1, reference: "FS 4170 Norli Lagunen" },
  { channel: "norli", copies: 1, reference: "FS 4612 Norli Markens gate" },
  { channel: "norli", copies: 1, reference: "FS 5023 Norli Strandgaten" },
  { channel: "norli", copies: 1, reference: "FS 5053 Norli Nordre gate" },
  { channel: "ark", copies: 4, reference: "FS 4027 ARK Tasta Stavanger" },
  {
    channel: "bibliotek",
    copies: 3,
    reference: "FS 35 Biblioteksentralen (+3)",
  },
];

const apply = process.argv.slice(2).includes("apply");
console.log(
  `\n${apply ? "SKRIVER" : "TØRRKJØRING"} — Boksalg mot Forlagssentralen 05.11.2026\n`
);

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "book-sales",
  limit: 1000,
  depth: 0,
  pagination: false,
});
const rows = docs as BookSale[];

const find = (m: Match) =>
  rows.filter(
    (row) =>
      dayKey(row.date) === m.day &&
      row.copies === m.copies &&
      row.channel === m.channel &&
      row.saleSource === m.saleSource
  );

let done = 0;
let skipped = 0;
let problems = 0;

for (const change of CHANGES) {
  const hits = find(change.before);
  if (hits.length > 1) {
    console.log(
      `?? ${change.label}\n   ${hits.length} rader passer — rett for hånd i admin.`
    );
    problems += 1;
    continue;
  }
  if (hits.length === 0) {
    const already = find({
      day: change.before.day,
      copies: change.after.copies ?? change.before.copies,
      channel: change.after.channel ?? change.before.channel,
      saleSource: change.after.saleSource ?? change.before.saleSource,
    });
    console.log(
      `-- ${change.label}\n   ${already.length > 0 ? "allerede gjort" : "fant ikke raden — sjekk i admin"}`
    );
    if (already.length > 0) skipped += 1;
    else problems += 1;
    continue;
  }
  console.log(`>> ${change.label}\n   oppdaterer rad ${hits[0].id}`);
  if (apply) {
    await payload.update({
      collection: "book-sales",
      id: hits[0].id,
      data: change.after,
    });
  }
  done += 1;
}

// Gamle rader har referansen «FS 35 Biblioteksentralen» uten tillegg, så
// sjekken går på hele strengen — ikke på kundenummeret alene.
const references = new Set(rows.map((row) => row.reference ?? ""));
for (const row of NEW_ROWS) {
  if (references.has(row.reference)) {
    console.log(`-- ${row.reference}: finnes allerede`);
    skipped += 1;
    continue;
  }
  console.log(`++ ${row.reference}: ${row.copies} på ${row.channel}, innkjøp`);
  if (apply) {
    await payload.create({
      collection: "book-sales",
      data: {
        date: REPORT_DAY,
        copies: row.copies,
        channel: row.channel,
        saleSource: "innkjop",
        reference: row.reference,
        notes: `${REPORT}. Dato er rapportdato, ikke ordredato.`,
      },
    });
  }
  done += 1;
}

// Vipps direkte til Susanne 05.11 — ikke nettbutikken (ingen ordrer i dag),
// så de telles ikke automatisk. Ført som de andre Vipps-salgene: egen/direkte.
const VIPPS_REFERENCE = "Vipps 05.11.2026";
if (references.has(VIPPS_REFERENCE)) {
  console.log(`-- ${VIPPS_REFERENCE}: finnes allerede`);
  skipped += 1;
} else {
  console.log(`++ ${VIPPS_REFERENCE}: 9 på egen, direktesalg`);
  if (apply) {
    await payload.create({
      collection: "book-sales",
      data: {
        date: REPORT_DAY,
        copies: 9,
        channel: "egen",
        saleSource: "direkte",
        reference: VIPPS_REFERENCE,
        notes: "Solgt med Vipps direkte, fra Susannes egne eksemplarer.",
      },
    });
  }
  done += 1;
}

console.log(
  `\n${apply ? "Gjort" : "Ville gjort"}: ${done} · allerede gjort: ${skipped} · må sjekkes: ${problems}`
);
if (!apply && done > 0) console.log("Kjør med «apply» for å skrive.");
process.exit(problems > 0 ? 1 : 0);

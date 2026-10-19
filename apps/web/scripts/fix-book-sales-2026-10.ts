/**
 * Retter Boksalg etter første avstemming mot Forlagssentralen (19.10.2026).
 *
 * Øyeblikksrapporten «Artikkel – ordreinfo» viste Norli 360 (300 Nygata,
 * 56 Pottemakerveien, 2 + 2 butikker), ARK 303 og Biblioteksentralen 4 —
 * mens Boksalg hadde Norli 400 + 94 forhåndssalg, pluss 22 bøker solgt fra
 * hylla ført som nye innkjøp. Se docs/BOKSALG.md, «Forlagssentralen er
 * fasiten for innkjøp».
 *
 * Hver endring finner raden på INNHOLD (dag, antall, kanal, type), ikke på
 * id, og hopper over når raden allerede er rettet. Nye rader lages bare når
 * referansen ikke finnes fra før. Skriptet kan derfor kjøres flere ganger.
 *
 *   # Tørrkjøring — viser hva som ville blitt gjort, skriver ingenting
 *   bun run --cwd apps/web payload run scripts/fix-book-sales-2026-10.ts
 *
 *   # Gjør endringene. bibliotek=NN er Biblioteksentralens andel i prosent
 *   # (fra fakturaen hos Forlagssentralen); uten den hoppes bibliotek over.
 *   bun run --cwd apps/web payload run scripts/fix-book-sales-2026-10.ts apply bibliotek=45
 */
import { dayKey } from "@/lib/boksalg/dates";
import type { BookEconomy, BookSale } from "@/payload-types";
import config from "@payload-config";
import { getPayload } from "payload";

type Channel = BookSale["channel"];
type Source = BookSale["saleSource"];

/** Slik raden ser ut i dag — nok til å finne den entydig. */
interface Match {
  day: string;
  copies: number;
  channel: Channel;
  saleSource: Source;
}

interface Change {
  label: string;
  before: Match;
  /** Felt som settes. Udefinert = raden slettes. */
  after?: Partial<
    Pick<BookSale, "copies" | "channel" | "saleSource" | "reference" | "notes">
  >;
}

const REPORT = "Forlagssentralen, øyeblikksrapport 19.10.2026";

const CHANGES: Change[] = [
  {
    label: "Norli innkjøp 400 → 300 (Nygata)",
    before: {
      day: "2026-09-10",
      copies: 400,
      channel: "norli",
      saleSource: "innkjop",
    },
    after: {
      copies: 300,
      reference: "FS 4545 Norli Nygata",
      notes: `${REPORT}: 300 fakturert til Nygata. 400 var aldri bestilt.`,
    },
  },
  {
    label: "ARK innkjøp 300 → 303",
    before: {
      day: "2026-09-13",
      copies: 300,
      channel: "ark",
      saleSource: "innkjop",
    },
    after: {
      copies: 303,
      reference: "FS 145 ARK-butikker à 2–3 + ARK.no + sentrallager",
      notes: `${REPORT}: 122 fakturert + 181 under pakking.`,
    },
  },
  {
    label: "Forhåndssalg 57 → 56 (Pottemakerveien), samler alle fire radene",
    before: {
      day: "2026-09-22",
      copies: 57,
      channel: "norli",
      saleSource: "forhandssalg",
    },
    after: {
      copies: 56,
      reference: "FS 1654 Norli Pottemakerveien",
      notes: `Norli oppgir 94 kundebestillinger via bok.norli.no (57 + 18 + 8 + 11). ${REPORT}: 56 fakturert. Resten føres som ny rad når kunde 1654 øker i «Kontert».`,
    },
  },
  {
    label: "Forhåndssalg 18 (28.09) — slettes, bakt inn i 22.09-raden",
    before: {
      day: "2026-09-28",
      copies: 18,
      channel: "norli",
      saleSource: "forhandssalg",
    },
  },
  {
    label: "Forhåndssalg 8 (05.10) — slettes, bakt inn i 22.09-raden",
    before: {
      day: "2026-10-05",
      copies: 8,
      channel: "norli",
      saleSource: "forhandssalg",
    },
  },
  {
    label: "Forhåndssalg 11 (12.10) — slettes, bakt inn i 22.09-raden",
    before: {
      day: "2026-10-12",
      copies: 11,
      channel: "norli",
      saleSource: "forhandssalg",
    },
  },
  {
    label: "3 på Vipps → Foredrag og kurs",
    before: {
      day: "2026-10-15",
      copies: 3,
      channel: "direkte",
      saleSource: "direkte",
    },
    after: { channel: "foredrag", saleSource: "foredrag" },
  },
  {
    label: "15 på lanseringsfesten → solgt fra hylla",
    before: {
      day: "2026-10-15",
      copies: 15,
      channel: "norli",
      saleSource: "innkjop",
    },
    after: { saleSource: "hyllesalg" },
  },
  {
    label: "7 under signering → solgt fra hylla",
    before: {
      day: "2026-10-17",
      copies: 7,
      channel: "norli",
      saleSource: "innkjop",
    },
    after: { saleSource: "hyllesalg" },
  },
];

const REPORT_DAY = "2026-10-19T00:00:00.000Z";

const NEW_ROWS: {
  reference: string;
  channel: Channel;
  copies: number;
  notes: string;
}[] = [
  {
    reference: "FS 4090 Amfi Madla 2 + FS 4472 Kvadrat 2",
    channel: "norli",
    copies: 4,
    notes: `${REPORT}. Dato er rapportdato, ikke ordredato.`,
  },
];

const BIBLIOTEK_ROW = {
  reference: "FS 35 Biblioteksentralen",
  channel: "bibliotek" as Channel,
  copies: 4,
  notes: `${REPORT}: 3 fakturert + 1 under produksjon. Dato er rapportdato.`,
};

// ---- Argumenter ------------------------------------------------------------
// `payload run` spiser --flagg, så ord i stedet: `apply` og `bibliotek=NN`.
const args = process.argv.slice(2);
const apply = args.includes("apply");
const bibliotekArg = args.find((arg) => arg.startsWith("bibliotek="));
const bibliotekPercent = bibliotekArg
  ? Number(bibliotekArg.slice("bibliotek=".length))
  : null;
if (
  bibliotekArg &&
  !(
    bibliotekPercent !== null &&
    bibliotekPercent >= 0 &&
    bibliotekPercent <= 100
  )
) {
  throw new Error(
    `Ugyldig bibliotek-prosent: «${bibliotekArg}» — bruk f.eks. bibliotek=45`
  );
}

const mode = apply ? "SKRIVER" : "TØRRKJØRING";
console.log(`\n${mode} — Boksalg mot Forlagssentralen 19.10.2026\n`);

const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "book-sales",
  limit: 1000,
  depth: 0,
  pagination: false,
});
const rows = docs as BookSale[];

const matches = (row: BookSale, m: Match) =>
  dayKey(row.date) === m.day &&
  row.copies === m.copies &&
  row.channel === m.channel &&
  row.saleSource === m.saleSource;

const find = (m: Match) => rows.filter((row) => matches(row, m));

/** Raden slik den vil se ut etter endringen — for å kjenne igjen «allerede gjort». */
const afterMatch = (change: Change): Match | null =>
  change.after
    ? {
        day: change.before.day,
        copies: change.after.copies ?? change.before.copies,
        channel: change.after.channel ?? change.before.channel,
        saleSource: change.after.saleSource ?? change.before.saleSource,
      }
    : null;

let updated = 0;
let deleted = 0;
let created = 0;
let skipped = 0;
let problems = 0;

// ---- Endringer og slettinger ----------------------------------------------
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
    const after = afterMatch(change);
    const alreadyDone = after ? find(after).length > 0 : true;
    console.log(
      `-- ${change.label}\n   ${alreadyDone ? "allerede gjort" : "fant ikke raden — sjekk i admin"}`
    );
    if (alreadyDone) skipped += 1;
    else problems += 1;
    continue;
  }

  const row = hits[0];
  if (!change.after) {
    console.log(`xx ${change.label}\n   sletter rad ${row.id}`);
    if (apply) {
      await payload.delete({ collection: "book-sales", id: row.id });
    }
    deleted += 1;
    continue;
  }

  const fields = Object.entries(change.after)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n     ");
  console.log(`~~ ${change.label}\n   rad ${row.id}:\n     ${fields}`);
  if (apply) {
    await payload.update({
      collection: "book-sales",
      id: row.id,
      data: change.after,
    });
  }
  updated += 1;
}

// ---- Nye rader (create-only på referanse) ---------------------------------
const createRow = async (row: (typeof NEW_ROWS)[number]) => {
  // Samme referanse, eller samme innhold på rapportdagen (f.eks. lagt inn
  // for hånd med en annen referansetekst) — da lages det ikke en dublett.
  const existing = rows.find(
    (candidate) =>
      candidate.reference === row.reference ||
      matches(candidate, {
        day: dayKey(REPORT_DAY),
        copies: row.copies,
        channel: row.channel,
        saleSource: "innkjop",
      })
  );
  if (existing) {
    console.log(
      `-- Ny rad «${row.reference}»\n   finnes allerede (rad ${existing.id}, referanse «${existing.reference ?? ""}»)`
    );
    skipped += 1;
    return;
  }
  console.log(
    `++ Ny rad «${row.reference}»\n   ${row.copies} bøker, ${row.channel}, innkjøp, ${dayKey(REPORT_DAY)}`
  );
  if (apply) {
    await payload.create({
      collection: "book-sales",
      data: {
        date: REPORT_DAY,
        copies: row.copies,
        channel: row.channel,
        saleSource: "innkjop",
        reference: row.reference,
        notes: row.notes,
      },
    });
  }
  created += 1;
};

for (const row of NEW_ROWS) {
  await createRow(row);
}

// ---- Bibliotek: kanal i Bokøkonomi + raden --------------------------------
if (bibliotekPercent === null) {
  console.log(
    "-- Bibliotek\n   hoppet over: oppgi bibliotek=NN (Biblioteksentralens andel i prosent, fra fakturaen) for å legge til kanalen og raden"
  );
  skipped += 1;
} else {
  const economy = await payload.findGlobal({ slug: "book-economy", depth: 0 });
  const channels = (economy.channels ?? []) as NonNullable<
    BookEconomy["channels"]
  >;
  const hasChannel = channels.some((channel) => channel.key === "bibliotek");

  if (hasChannel) {
    console.log("-- Kanal «Bibliotek» i Bokøkonomi\n   finnes allerede");
    skipped += 1;
  } else {
    console.log(
      `++ Kanal «Bibliotek» i Bokøkonomi\n   forhandlerandel ${bibliotekPercent} %, returrett 0, ingen lagerkilde`
    );
    if (apply) {
      await payload.updateGlobal({
        slug: "book-economy",
        data: {
          channels: [
            ...channels,
            {
              key: "bibliotek",
              label: "Bibliotek",
              active: true,
              stockSource: "none",
              retailerPercent: bibliotekPercent,
              distributionPercent: 0,
              distributionPerCopy: 0,
              transactionPercent: 0,
              transactionPerCopy: 0,
              maxReturnPercent: 0,
            },
          ],
        },
      });
    }
    created += 1;
  }

  await createRow(BIBLIOTEK_ROW);
}

// ---- Oppsummering ----------------------------------------------------------
console.log(
  `\n${mode}: ${updated} endret, ${deleted} slettet, ${created} opprettet, ${skipped} hoppet over, ${problems} å se på.`
);
if (!apply) {
  console.log(
    "Ingenting er skrevet. Kjør med «apply» for å gjøre endringene.\n"
  );
}

process.exit(problems > 0 ? 1 : 0);

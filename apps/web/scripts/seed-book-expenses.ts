/**
 * Seeder utgiftene til «Verdifull vekst» inn i Bokutgifter.
 *
 * STRENGT create-only: en utgift som allerede finnes (samme beskrivelse og
 * beløp) hoppes over, aldri oppdateres. Susanne retter datoer og legger ved
 * kvitteringer i admin, og det skal et nytt scriptkjør aldri overskrive.
 *
 * Datoene er ukjente ved import og settes til i dag — derfor står det i
 * notatet at de må rettes. Beløpene er derimot eksakte.
 *
 *   bun run --cwd apps/web payload run scripts/seed-book-expenses.ts
 */
import type { BookExpense } from "@/payload-types";
import config from "@payload-config";
import { getPayload } from "payload";

const IMPORT_NOTE = "Importert 22.09.2026 — sett riktig fakturadato.";

const expenses: {
  description: string;
  category: BookExpense["category"];
  amount: number;
  supplier?: string;
  notes?: string;
}[] = [
  { description: "Design, første faktura", category: "design", amount: 83750 },
  { description: "Design, andre faktura", category: "design", amount: 37500 },
  {
    description: "Redaktør, første faktura",
    category: "redaktor",
    amount: 68000,
  },
  {
    description: "Redaktør, andre faktura",
    category: "redaktor",
    amount: 62500,
  },
  { description: "Oversetter", category: "oversetter", amount: 15625 },
  { description: "Bokbasen, faktura 1", category: "bokbasen", amount: 700 },
  { description: "Bokbasen, faktura 2", category: "bokbasen", amount: 1635 },
  { description: "Bokbasen, faktura 3", category: "bokbasen", amount: 1600 },
  { description: "Bokbasen, faktura 4", category: "bokbasen", amount: 1875 },
  {
    description: "Forlagsentralen",
    category: "forlagsentralen",
    amount: 2984,
  },
  {
    description: "Trykkeri",
    category: "trykkeri",
    amount: 0,
    notes:
      "Fyll inn beløpet for HELE opplaget når fakturaen kommer. Trykk er en engangskostnad, ikke et fradrag per solgte bok — føres det begge steder betales opplaget to ganger i regnestykket.",
  },
];

const payload = await getPayload({ config });
const today = new Date().toISOString();

let created = 0;
let skipped = 0;

for (const expense of expenses) {
  const existing = await payload.find({
    collection: "book-expenses",
    where: {
      and: [
        { description: { equals: expense.description } },
        { amount: { equals: expense.amount } },
      ],
    },
    limit: 1,
    depth: 0,
  });

  if (existing.totalDocs > 0) {
    console.log(`  hopper over (finnes): ${expense.description}`);
    skipped += 1;
    continue;
  }

  await payload.create({
    collection: "book-expenses",
    data: {
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: today,
      supplier: expense.supplier ?? null,
      notes: expense.notes ? `${expense.notes}\n${IMPORT_NOTE}` : IMPORT_NOTE,
    },
  });
  console.log(`  opprettet: ${expense.description} — ${expense.amount} kr`);
  created += 1;
}

const sum = expenses.reduce((total, expense) => total + expense.amount, 0);
console.log(
  `\nFerdig. ${created} opprettet, ${skipped} hoppet over. Sum i lista: ${sum.toLocaleString("nb-NO")} kr.`
);

process.exit(0);

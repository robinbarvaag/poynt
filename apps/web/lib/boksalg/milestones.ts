/**
 * Milepæler for boka — små seire å glede seg over underveis, og et blikk på
 * hva som er neste. Ren regning på tall dashbordet allerede har, så det
 * finnes ingen «milepæl»-tabell å holde ved like.
 *
 * Rekkefølgen er bevisst kronologisk for en boklansering: først innsalget,
 * så utgivelsen, så butikkhyllene, så økonomien.
 */

export interface Milestone {
  key: string;
  label: string;
  reached: boolean;
  /** Hvor langt det er igjen, eller hva som ble oppnådd. */
  detail: string;
}

export interface MilestoneInput {
  /** Solgt inn, alle kanaler. */
  copies: number;
  /** Bestillinger i egen nettbutikk. */
  ownShopCopies: number;
  /** Netto til Susanne så langt. */
  net: number;
  expenses: number;
  printRun: number | null;
  released: boolean;
  storesWithBook: number;
  regionsWithBook: number;
  regionsTotal: number;
  /** Bøker ut av butikkhyllene (estimat). */
  sellThrough: number;
}

const antall = (value: number) => value.toLocaleString("nb-NO");

function countMilestone(
  key: string,
  label: string,
  value: number,
  target: number,
  unit: string
): Milestone {
  const reached = value >= target;
  return {
    key,
    label,
    reached,
    detail: reached
      ? `${antall(value)} ${unit}`
      : `${antall(value)} av ${antall(target)} ${unit}`,
  };
}

export function milestones(input: MilestoneInput): Milestone[] {
  const list: Milestone[] = [
    countMilestone(
      "first-sale",
      "Første bok solgt inn",
      input.copies,
      1,
      "solgt inn"
    ),
    countMilestone("100", "100 bøker solgt inn", input.copies, 100, "bøker"),
    countMilestone("500", "500 bøker solgt inn", input.copies, 500, "bøker"),
    countMilestone(
      "1000",
      "1 000 bøker solgt inn",
      input.copies,
      1000,
      "bøker"
    ),
  ];

  if (input.printRun !== null && input.printRun > 0) {
    list.push(
      countMilestone(
        "print-run",
        "Hele opplaget solgt inn",
        input.copies,
        input.printRun,
        "trykte"
      )
    );
  }

  list.push({
    key: "first-shop-order",
    label: "Første bestilling på poynt.no",
    reached: input.ownShopCopies >= 1,
    detail:
      input.ownShopCopies >= 1
        ? `${antall(input.ownShopCopies)} bestilt`
        : "Ingen ennå",
  });

  list.push({
    key: "release",
    label: "Boka er ute",
    reached: input.released,
    detail: input.released ? "Utgitt" : "Venter på utgivelsesdatoen",
  });

  list.push(
    countMilestone(
      "first-store",
      "Første butikk med boka i hylla",
      input.storesWithBook,
      1,
      "butikker"
    ),
    countMilestone(
      "50-stores",
      "Boka i 50 butikker",
      input.storesWithBook,
      50,
      "butikker"
    )
  );

  if (input.regionsTotal > 0) {
    list.push(
      countMilestone(
        "all-regions",
        "Boka i alle fylker",
        input.regionsWithBook,
        input.regionsTotal,
        "fylker"
      )
    );
  }

  list.push(
    countMilestone(
      "first-sell-through",
      "Første bok ut av en butikkhylle",
      input.sellThrough,
      1,
      "ut av hyllene"
    )
  );

  const halfway = input.expenses / 2;
  const percent =
    input.expenses > 0 ? Math.round((input.net / input.expenses) * 100) : 100;
  list.push(
    {
      key: "half",
      label: "Halvveis til null",
      reached: input.expenses > 0 && input.net >= halfway,
      detail: `${percent} % av utgiftene dekket`,
    },
    {
      key: "break-even",
      label: "Boka går i null",
      reached: input.expenses > 0 && input.net >= input.expenses,
      detail:
        input.net >= input.expenses
          ? "I pluss!"
          : `${antall(Math.round(input.expenses - input.net))} kr igjen`,
    }
  );

  return list;
}

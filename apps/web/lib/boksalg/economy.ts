/**
 * Bokøkonomien for «Verdifull vekst». Ren regning uten I/O, så den kan testes
 * direkte (economy.test.ts) og gjenbrukes både i dashbordet og i eventuelle
 * e-postrapporter.
 *
 * Modellen: boka koster det samme overalt (399), men hva Susanne sitter igjen
 * med varierer kraftig per kanal. Norli og ARK tar 50 %. Redaktøren tar 10 %
 * av alle salg — og om de 10 prosentene regnes FØR eller ETTER bokhandelens
 * kutt er en avtaledetalj som flytter ~20 kr per bok, så den er et valg i
 * «Bokøkonomi» og ikke en antakelse i koden.
 */

/** Regnes redaktørens andel av utsalgsprisen, eller av det som står igjen? */
export type EditorBasis = "brutto" | "netto";

export interface EconomySettings {
  /** Utsalgspris inkl. mva. Bøker har 0 % mva i Norge, så brutto = netto. */
  listPrice: number;
  editorPercent: number;
  editorBasis: EditorBasis;
}

/**
 * Trykk er bevisst IKKE en kostnad per bok her. Boka trykkes i opplag og hele
 * fakturaen betales opp front, akkurat som design og redaktørhonorar — altså
 * hører den hjemme som en rad i Bokutgifter, som er nevneren break-even skal
 * dekke. Trakk vi i tillegg en trykkekostnad fra hvert salg, ville opplaget
 * blitt betalt to ganger i regnestykket.
 *
 * Distribusjon og kortgebyr står derimot med under, fordi de påløper per salg.
 */

export interface ChannelRates {
  key: string;
  label: string;
  /** Bokhandelens andel av utsalgsprisen. 50 for Norli/ARK, 0 for egen butikk. */
  retailerPercent: number;
  /** Forlagsentralen o.l. — prosent av utsalgspris. */
  distributionPercent: number;
  /** ...og/eller et fast beløp per bok (plukk/pakk). */
  distributionPerCopy: number;
  /** Kortgebyr: Stripe tar ca. 1,4 % + 2 kr. Kun relevant i egen butikk. */
  transactionPercent: number;
  transactionPerCopy: number;
  /**
   * Hvor stor del av innkjøpet bokhandelen kan sende tilbake (0–100). Norli og
   * ARK: 50. Påvirker ikke prisen per bok — bare hvor sikker inntekten er.
   */
  maxReturnPercent?: number;
}

/** Hva ett solgt eksemplar i én kanal er verdt, krone for krone. */
export interface UnitEconomics {
  listPrice: number;
  retailerCut: number;
  editorCut: number;
  distributionCut: number;
  transactionFee: number;
  /** Det Susanne faktisk sitter igjen med. Kan bli negativt — da sier vi det. */
  net: number;
}

/** Avrunding til øre, så summene ikke drifter på flyttallsstøv. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function unitEconomics(
  settings: EconomySettings,
  channel: ChannelRates
): UnitEconomics {
  const listPrice = settings.listPrice;
  const retailerCut = listPrice * (channel.retailerPercent / 100);

  // Kjernen i modellen: grunnlaget for redaktørens 10 %.
  const editorBase =
    settings.editorBasis === "brutto" ? listPrice : listPrice - retailerCut;
  const editorCut = editorBase * (settings.editorPercent / 100);

  const distributionCut =
    listPrice * (channel.distributionPercent / 100) +
    channel.distributionPerCopy;
  const transactionFee =
    listPrice * (channel.transactionPercent / 100) + channel.transactionPerCopy;

  return {
    listPrice: round(listPrice),
    retailerCut: round(retailerCut),
    editorCut: round(editorCut),
    distributionCut: round(distributionCut),
    transactionFee: round(transactionFee),
    net: round(
      listPrice - retailerCut - editorCut - distributionCut - transactionFee
    ),
  };
}

/** Antall solgte bøker per kanal. */
export type ChannelVolumes = Record<string, number>;

export interface Totals {
  copies: number;
  revenue: number;
  /** Sum netto til Susanne. */
  net: number;
  retailerCut: number;
  editorCut: number;
  distributionCut: number;
  transactionFee: number;
}

export function totals(
  settings: EconomySettings,
  channels: ChannelRates[],
  volumes: ChannelVolumes
): Totals {
  const sum: Totals = {
    copies: 0,
    revenue: 0,
    net: 0,
    retailerCut: 0,
    editorCut: 0,
    distributionCut: 0,
    transactionFee: 0,
  };

  for (const channel of channels) {
    const copies = volumes[channel.key] ?? 0;
    if (copies === 0) continue;
    const unit = unitEconomics(settings, channel);
    sum.copies += copies;
    sum.revenue += unit.listPrice * copies;
    sum.net += unit.net * copies;
    sum.retailerCut += unit.retailerCut * copies;
    sum.editorCut += unit.editorCut * copies;
    sum.distributionCut += unit.distributionCut * copies;
    sum.transactionFee += unit.transactionFee * copies;
  }

  for (const key of Object.keys(sum) as (keyof Totals)[]) {
    sum[key] = round(sum[key]);
  }
  return sum;
}

export interface BreakEven {
  /** Bøker som må selges i denne kanalen alene for å dekke utgiftene. */
  copiesNeeded: number | null;
  netPerCopy: number;
}

/**
 * Break-even per kanal. `null` når netto per bok er null eller negativ — da
 * finnes det ikke noe antall som dekker utgiftene, og å vise «Infinity» eller
 * et negativt tall ville vært verre enn å si at det ikke går opp.
 */
export function breakEven(
  settings: EconomySettings,
  channel: ChannelRates,
  totalExpenses: number
): BreakEven {
  const netPerCopy = unitEconomics(settings, channel).net;
  return {
    netPerCopy,
    copiesNeeded: netPerCopy > 0 ? Math.ceil(totalExpenses / netPerCopy) : null,
  };
}

/**
 * Hvor langt vi er kommet mot å dekke utgiftene, basert på faktisk salgsmiks.
 * `remainingAtCurrentMix` svarer på «hvor mange bøker til, hvis det fortsetter
 * å fordele seg som nå» — mer nyttig enn et break-even-tall per kanal når
 * salget skjer i flere kanaler samtidig.
 */
export interface Coverage {
  totalExpenses: number;
  netEarned: number;
  result: number;
  coveredPercent: number;
  averageNetPerCopy: number | null;
  remainingAtCurrentMix: number | null;
}

export function coverage(earned: Totals, totalExpenses: number): Coverage {
  const averageNetPerCopy =
    earned.copies > 0 ? round(earned.net / earned.copies) : null;
  const missing = totalExpenses - earned.net;

  return {
    totalExpenses: round(totalExpenses),
    netEarned: round(earned.net),
    result: round(earned.net - totalExpenses),
    coveredPercent:
      totalExpenses > 0
        ? round(Math.max(0, (earned.net / totalExpenses) * 100))
        : 100,
    averageNetPerCopy,
    remainingAtCurrentMix:
      missing > 0 && averageNetPerCopy && averageNetPerCopy > 0
        ? Math.ceil(missing / averageNetPerCopy)
        : missing > 0
          ? null
          : 0,
  };
}

/**
 * Returrisiko. Bokhandlene kjøper inn med returrett: Norli og ARK kan sende
 * tilbake inntil 50 % av det de kjøpte, og da forsvinner inntekten for de
 * bøkene igjen. «Solgt inn» er derfor ikke det samme som «sikret».
 *
 * Grunnlaget er bare innkjøpet (minus returer som allerede er ført) — bøker
 * som er forhåndsbestilt av en kunde eller avregnet er solgt videre og kommer
 * ikke tilbake. `percent` er scenarioet slideren står på; hver kanal kappes
 * ved sin egen returrett, så 50 % på slideren gir 0 for egen nettbutikk.
 */
export interface ReturnRiskChannel {
  key: string;
  label: string;
  /** Bøker bokhandelen fortsatt kan sende tilbake (innkjøp − ført retur). */
  returnable: number;
  /** Returprosenten som faktisk brukes: min(scenario, kanalens returrett). */
  effectivePercent: number;
  /** Bøker som kommer tilbake i scenarioet. */
  returned: number;
  /** Netto Susanne mister for dem. */
  netLost: number;
}

export interface ReturnRisk {
  percent: number;
  channels: ReturnRiskChannel[];
  copiesReturned: number;
  netLost: number;
  /** Netto som står igjen etter returene — det som er sikret i scenarioet. */
  netAfter: number;
  after: Coverage;
}

/** Høyeste returrett blant kanalene — slideren går fra 0 dit. */
export function maxReturnPercent(channels: ChannelRates[]): number {
  return Math.max(
    0,
    ...channels.map((channel) => channel.maxReturnPercent ?? 0)
  );
}

export function returnRisk(
  settings: EconomySettings,
  channels: ChannelRates[],
  returnable: ChannelVolumes,
  earned: Totals,
  totalExpenses: number,
  percent: number
): ReturnRisk {
  const rows: ReturnRiskChannel[] = [];
  let copiesReturned = 0;
  let netLost = 0;

  for (const channel of channels) {
    const base = Math.max(0, returnable[channel.key] ?? 0);
    const effectivePercent = Math.min(
      Math.max(0, percent),
      channel.maxReturnPercent ?? 0
    );
    const returned = Math.round((base * effectivePercent) / 100);
    const lost = round(returned * unitEconomics(settings, channel).net);
    copiesReturned += returned;
    netLost += lost;
    rows.push({
      key: channel.key,
      label: channel.label,
      returnable: base,
      effectivePercent,
      returned,
      netLost: lost,
    });
  }

  netLost = round(netLost);
  const netAfter = round(earned.net - netLost);

  return {
    percent,
    channels: rows,
    copiesReturned,
    netLost,
    netAfter,
    after: coverage(
      { ...earned, copies: earned.copies - copiesReturned, net: netAfter },
      totalExpenses
    ),
  };
}

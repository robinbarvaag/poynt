import type {
  BookEconomy,
  BookExpense,
  BookSale,
  BookStockEvent,
  BookStockSnapshot,
  BookStore,
  Order,
} from "@/payload-types";
import type { Payload } from "payload";
import {
  EXPENSE_CATEGORIES,
  type FollowUpStatus,
  RETURNABLE_SOURCES,
  RETURN_SOURCE,
  type SaleSource,
  type StoreStatus,
  labelFor,
  storeStatus,
} from "./constants";
import {
  type BreakEven,
  type ChannelRates,
  type ChannelVolumes,
  type Coverage,
  type EconomySettings,
  type Totals,
  type UnitEconomics,
  breakEven,
  coverage,
  totals,
  unitEconomics,
} from "./economy";
import { type Milestone, milestones } from "./milestones";
import type { Availability, StoreStock } from "./types";

/**
 * Samler alt boksalg-dashbordet trenger i ett kall: økonomien fra Bokøkonomi,
 * utgiftene, salgene (både faktiske og estimerte) og siste lagerbilde.
 *
 * Tre kilder til salgstall, med ulik pålitelighet — dashbordet skal vise
 * hvilken som er hvilken, ikke smelte dem sammen til ett tall som later som
 * det er fasit:
 *
 *   1. Bestillinger i egen nettbutikk  — eksakt
 *   2. Manuelt førte salg/avregninger  — eksakt (avregningen er fasit)
 *   3. Nedgang i butikkenes lagertall  — estimat
 */

export type SourceKey = BookStockSnapshot["sourceKey"];

export interface ChannelSummary {
  key: string;
  label: string;
  rates: ChannelRates;
  unit: UnitEconomics;
  /** Solgt inn — bøker Susanne faktisk har fått betalt for. Eksakt. */
  copies: number;
  /**
   * Bøker som har forlatt butikkhyllene, utledet av lagernedgang. Etterspørsel,
   * ikke omsetning — skal aldri legges til `copies`. `null` for kanaler uten
   * lagerkilde.
   */
  sellThrough: number | null;
  breakEven: BreakEven;
  /**
   * Solgt inn fordelt på salgstype, med kort etikett («innkjøp»,
   * «forhåndssalg», «nettbutikken»). Returer står negativt.
   */
  bySource: { source: string; label: string; copies: number }[];
  /** Innkjøp minus ført retur — det bokhandelen fortsatt kan sende tilbake. */
  returnable: number;
  maxReturnPercent: number;
}

/** Eksemplarer ute i butikk, dag for dag — utrullingen og påfyllene. */
export interface StockHistoryPoint {
  date: string;
  copies: number;
  stores: number;
}

export interface StockSummary {
  sourceKey: SourceKey;
  label: string;
  online: Availability;
  fetchedAt: string | null;
  storeCount: number;
  storesWithStock: number;
  totalCopies: number;
  note: string | null;
  history: StockHistoryPoint[];
}

/**
 * Én butikk slik dashbordet trenger den: kjedens data, lagertall, og Susannes
 * oppfølging — flatet ut fra «Butikker»-samlingen, med status utledet.
 */
export interface StoreRow {
  id: number;
  sourceKey: SourceKey;
  storeId: string;
  name: string;
  city: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  schedule: string | null;
  latitude: number | null;
  longitude: number | null;
  currentQty: number;
  maxQty: number;
  soldEstimate: number;
  restockedEstimate: number;
  firstStockedAt: string | null;
  status: StoreStatus;
  followUpStatus: FollowUpStatus;
  followUpAt: string | null;
  notes: string | null;
  /** Bøker ut av hylla i denne butikken de siste sju dagene (estimat). */
  recentSales: number;
  lastSaleAt: string | null;
}

/** Nylig salgsaktivitet per butikk, nøkkel `${sourceKey}:${storeId}`. */
type RecentActivity = Map<string, { recentSales: number; lastSaleAt: string }>;

const RECENT_DAYS = 7;

/** Fylkesvis oppsummering — «hvor står boka, og hvor selger den». */
export interface RegionSummary {
  region: string;
  stores: number;
  withStock: number;
  copies: number;
  sold: number;
}

export interface TimelinePoint {
  date: string;
  copies: number;
}

export interface RecentEvent {
  id: string;
  occurredAt: string;
  type: BookStockEvent["type"];
  sourceKey: SourceKey;
  storeName: string | null;
  city: string | null;
  delta: number;
  fromQty: number | null;
  toQty: number | null;
  note: string | null;
}

export interface ExpenseGroup {
  category: string;
  label: string;
  amount: number;
  count: number;
}

export interface BookDashboardData {
  book: {
    title: string;
    isbn: string;
    releaseDate: string | null;
    listPrice: number;
    printRun: number | null;
    daysUntilRelease: number | null;
    released: boolean;
  };
  settings: EconomySettings;
  channels: ChannelSummary[];
  totals: Totals;
  coverage: Coverage;
  /** Per kanal: bøker bokhandelen fortsatt kan returnere. Mates til retur-slideren. */
  returnable: ChannelVolumes;
  milestones: Milestone[];
  expenses: {
    total: number;
    groups: ExpenseGroup[];
    missingPrintInvoice: boolean;
  };
  stock: StockSummary[];
  /** Alle butikker vi kjenner, med kontaktinfo og oppfølging. */
  stores: StoreRow[];
  regions: RegionSummary[];
  /** Solgt inn per dag — det Susanne har fått betalt for. */
  timeline: TimelinePoint[];
  /** Ut av butikkhyllene per dag. Etterspørsel, ikke omsetning. */
  sellThroughTimeline: TimelinePoint[];
  /** Sum bøker ut av hyllene, på tvers av kilder. */
  sellThroughTotal: number;
  events: RecentEvent[];
  warnings: string[];
}

const SOURCE_LABELS: Record<SourceKey, string> = { norli: "Norli", ark: "ARK" };

/** Korte etiketter for fordelingen under «Solgt inn» i kanaltabellen. */
const SALE_SOURCE_SHORT: Record<SaleSource, string> = {
  innkjop: "innkjøp",
  forhandssalg: "forhåndssalg",
  avregning: "avregning",
  foredrag: "foredrag",
  direkte: "direkte",
  retur: "retur",
  annet: "annet",
};

/** Kanal fra Bokøkonomi, med nullbare satser fylt ut. */
type Channel = ChannelRates & {
  stockSource: "none" | SourceKey;
  active: boolean;
};

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function readChannels(economy: BookEconomy): Channel[] {
  return (economy.channels ?? [])
    .filter((row) => row.active !== false)
    .map((row) => ({
      key: row.key,
      label: row.label,
      retailerPercent: row.retailerPercent ?? 0,
      distributionPercent: row.distributionPercent ?? 0,
      distributionPerCopy: row.distributionPerCopy ?? 0,
      transactionPercent: row.transactionPercent ?? 0,
      transactionPerCopy: row.transactionPerCopy ?? 0,
      maxReturnPercent: row.maxReturnPercent ?? 0,
      stockSource: row.stockSource ?? "none",
      active: true,
    }));
}

function toStoreRow(doc: BookStore, recent: RecentActivity): StoreRow {
  const currentQty = doc.currentQty ?? 0;
  const maxQty = doc.maxQty ?? 0;
  const activity = recent.get(`${doc.sourceKey}:${doc.storeId}`);
  return {
    recentSales: activity?.recentSales ?? 0,
    lastSaleAt: activity?.lastSaleAt ?? null,
    id: doc.id,
    sourceKey: doc.sourceKey,
    storeId: doc.storeId,
    name: doc.name,
    city: doc.city ?? null,
    region: doc.region ?? null,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    address: doc.address ?? null,
    postcode: doc.postcode ?? null,
    schedule: doc.schedule ?? null,
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    currentQty,
    maxQty,
    soldEstimate: doc.soldEstimate ?? 0,
    restockedEstimate: doc.restockedEstimate ?? 0,
    firstStockedAt: doc.firstStockedAt ?? null,
    status: storeStatus(currentQty, maxQty),
    followUpStatus: doc.followUpStatus ?? "ingen",
    followUpAt: doc.followUpAt ?? null,
    notes: doc.notes ?? null,
  };
}

/** Summerer butikkene per fylke, sortert på solgt og deretter beholdning. */
function summarizeRegions(stores: StoreRow[]): RegionSummary[] {
  const byRegion = new Map<string, RegionSummary>();
  for (const store of stores) {
    const region = store.region ?? "Ukjent";
    const entry = byRegion.get(region) ?? {
      region,
      stores: 0,
      withStock: 0,
      copies: 0,
      sold: 0,
    };
    entry.stores += 1;
    if (store.currentQty > 0) entry.withStock += 1;
    entry.copies += store.currentQty;
    entry.sold += store.soldEstimate;
    byRegion.set(region, entry);
  }
  return [...byRegion.values()].sort(
    (a, b) =>
      b.sold - a.sold ||
      b.copies - a.copies ||
      a.region.localeCompare(b.region, "nb")
  );
}

export async function getBookDashboard(
  payload: Payload
): Promise<BookDashboardData> {
  const economy = await payload.findGlobal({ slug: "book-economy", depth: 0 });

  const settings: EconomySettings = {
    listPrice: economy.listPrice ?? 399,
    editorPercent: economy.editorPercent ?? 10,
    editorBasis: economy.editorBasis === "netto" ? "netto" : "brutto",
  };

  const channels = readChannels(economy);
  const warnings: string[] = [];

  // ---- Utgifter -----------------------------------------------------------
  const expenseDocs = await payload.find({
    collection: "book-expenses",
    limit: 1000,
    depth: 0,
    pagination: false,
  });

  const groupMap = new Map<string, ExpenseGroup>();
  let expenseTotal = 0;
  for (const doc of expenseDocs.docs as BookExpense[]) {
    expenseTotal += doc.amount;
    const existing = groupMap.get(doc.category);
    if (existing) {
      existing.amount += doc.amount;
      existing.count += 1;
    } else {
      groupMap.set(doc.category, {
        category: doc.category,
        label: labelFor([...EXPENSE_CATEGORIES], doc.category),
        amount: doc.amount,
        count: 1,
      });
    }
  }
  const groups = [...groupMap.values()].sort((a, b) => b.amount - a.amount);

  // Trykk er en opplagskostnad, ikke en sats per bok (se economy.ts). Mangler
  // trykkeri-fakturaen er det utgiftssummen — og dermed break-even — som er
  // for lav, ikke marginen per bok.
  const printExpenses = groupMap.get("trykkeri")?.amount ?? 0;
  if (printExpenses === 0) {
    warnings.push(
      "Trykkeriet står oppført med 0 kr. Utgiftssummen er derfor for lav, og boka ser nærmere break-even ut enn den er — legg inn fakturaen under Bokutgifter."
    );
  }

  // ---- Manuelt førte salg -------------------------------------------------
  const manualDocs = await payload.find({
    collection: "book-sales",
    limit: 1000,
    depth: 0,
    pagination: false,
  });

  const manualByChannel = new Map<string, number>();
  const bySourceByChannel = new Map<string, Map<SaleSource, number>>();
  const returnableByChannel = new Map<string, number>();
  const soldInByDay = new Map<string, number>();

  for (const doc of manualDocs.docs as BookSale[]) {
    const source = doc.saleSource as SaleSource;
    // En retur trekkes fra — og fra innkjøpet, siden det er innkjøpet som har
    // returrett. Forhåndssalg og avregninger er bøker som har gått til en
    // kunde og kommer ikke tilbake.
    const signed = source === RETURN_SOURCE ? -doc.copies : doc.copies;

    manualByChannel.set(
      doc.channel,
      (manualByChannel.get(doc.channel) ?? 0) + signed
    );

    const sources =
      bySourceByChannel.get(doc.channel) ?? new Map<SaleSource, number>();
    sources.set(source, (sources.get(source) ?? 0) + signed);
    bySourceByChannel.set(doc.channel, sources);

    if (RETURNABLE_SOURCES.includes(source) || source === RETURN_SOURCE) {
      returnableByChannel.set(
        doc.channel,
        (returnableByChannel.get(doc.channel) ?? 0) + signed
      );
    }

    const day = dayKey(doc.date);
    soldInByDay.set(day, (soldInByDay.get(day) ?? 0) + signed);
  }

  // ---- Faktiske bestillinger i egen nettbutikk ----------------------------
  const shopProductId =
    typeof economy.shopProduct === "object" && economy.shopProduct !== null
      ? economy.shopProduct.id
      : (economy.shopProduct ?? null);

  let shopCopies = 0;
  if (shopProductId !== null) {
    const orders = await payload.find({
      collection: "orders",
      where: {
        status: { equals: "paid" },
        "items.product": { equals: shopProductId },
      },
      limit: 1000,
      depth: 0,
      pagination: false,
    });

    for (const order of orders.docs as Order[]) {
      const copies = order.items
        .filter((item) => {
          const productId =
            typeof item.product === "object" ? item.product.id : item.product;
          return productId === shopProductId;
        })
        .reduce((sum, item) => sum + (item.quantity ?? 1), 0);
      if (copies === 0) continue;
      shopCopies += copies;
      const day = dayKey(order.createdAt);
      soldInByDay.set(day, (soldInByDay.get(day) ?? 0) + copies);
    }
  } else {
    warnings.push(
      "Boka er ikke koblet til et produkt i nettbutikken, så bestillinger derfra telles ikke med. Sett «Boka i nettbutikken» i Bokøkonomi."
    );
  }

  // ---- «Ut av hyllene»: etterspørsel, ikke omsetning ----------------------
  //
  // Dette er bøker som har forlatt en butikkhylle, utledet av at lageret gikk
  // ned. De er IKKE omsetning: de samme bøkene ble betalt for da bokhandelen
  // kjøpte dem inn, og legges de sammen med salgsradene telles de to ganger.
  // De hører hjemme som etterspørselssignal — går hyllene fort tomme, kommer
  // det en etterbestilling.
  const saleEvents = await payload.find({
    collection: "book-stock-events",
    where: { type: { equals: "sale" } },
    limit: 5000,
    depth: 0,
    pagination: false,
    sort: "-occurredAt",
  });

  const sellThroughBySource = new Map<string, number>();
  const sellThroughByDay = new Map<string, number>();
  // Hvilke butikker det har skjedd noe i nylig — de får «lys» på kartet.
  const recentActivity: RecentActivity = new Map();
  const recentCutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  for (const doc of saleEvents.docs as BookStockEvent[]) {
    const day = dayKey(doc.occurredAt);
    const delta = doc.delta ?? 0;
    sellThroughBySource.set(
      doc.sourceKey,
      (sellThroughBySource.get(doc.sourceKey) ?? 0) + delta
    );
    sellThroughByDay.set(day, (sellThroughByDay.get(day) ?? 0) + delta);

    if (doc.storeId && new Date(doc.occurredAt).getTime() >= recentCutoff) {
      const key = `${doc.sourceKey}:${doc.storeId}`;
      const existing = recentActivity.get(key);
      recentActivity.set(key, {
        recentSales: (existing?.recentSales ?? 0) + delta,
        // Hendelsene er sortert nyeste først, så den første vi ser er siste.
        lastSaleAt: existing?.lastSaleAt ?? doc.occurredAt,
      });
    }
  }

  // ---- Sett det sammen per kanal -----------------------------------------
  //
  // Bare «solgt inn» teller: manuelt førte salg (inkludert bokhandlernes
  // innkjøp) og bestillinger i egen nettbutikk. Butikk-estimatene holdes
  // utenfor med vilje — se blokken over.
  const volumes: Record<string, number> = {};
  const returnable: ChannelVolumes = {};
  const channelSummaries: ChannelSummary[] = channels.map((channel) => {
    const manual = manualByChannel.get(channel.key) ?? 0;
    const shop = channel.key === "egen" ? shopCopies : 0;
    const copies = manual + shop;
    volumes[channel.key] = copies;
    returnable[channel.key] = Math.max(
      0,
      returnableByChannel.get(channel.key) ?? 0
    );

    const bySource = [...(bySourceByChannel.get(channel.key) ?? new Map())]
      .filter(([, count]) => count !== 0)
      .map(([source, count]) => ({
        source: source as string,
        label: SALE_SOURCE_SHORT[source as SaleSource] ?? source,
        copies: count as number,
      }));
    if (shop > 0) {
      bySource.push({
        source: "nettbutikk",
        label: "nettbutikken",
        copies: shop,
      });
    }

    return {
      key: channel.key,
      label: channel.label,
      rates: channel,
      unit: unitEconomics(settings, channel),
      copies,
      sellThrough:
        channel.stockSource !== "none"
          ? (sellThroughBySource.get(channel.stockSource) ?? 0)
          : null,
      breakEven: breakEven(settings, channel, expenseTotal),
      bySource,
      returnable: returnable[channel.key],
      maxReturnPercent: channel.maxReturnPercent ?? 0,
    };
  });

  const summed = totals(settings, channels, volumes);

  // ---- Lagerbilde per kilde ----------------------------------------------
  const sourceKeys = [
    ...new Set(
      channels
        .map((channel) => channel.stockSource)
        .filter((key): key is SourceKey => key !== "none")
    ),
  ];

  const stock: StockSummary[] = [];
  for (const sourceKey of sourceKeys) {
    const { docs } = await payload.find({
      collection: "book-stock-snapshots",
      where: { sourceKey: { equals: sourceKey } },
      sort: "-fetchedAt",
      limit: 1,
      depth: 0,
    });
    const latest = (docs as BookStockSnapshot[])[0];

    // Lagerhistorikk: siste bilde per dag, så to kjøringer samme dag ikke gir
    // to punkter på linja.
    const history = await payload.find({
      collection: "book-stock-snapshots",
      where: { sourceKey: { equals: sourceKey } },
      sort: "fetchedAt",
      limit: 400,
      depth: 0,
      pagination: false,
    });
    const byDay = new Map<string, StockHistoryPoint>();
    for (const entry of history.docs as BookStockSnapshot[]) {
      const date = dayKey(entry.fetchedAt);
      byDay.set(date, {
        date,
        copies: entry.totalCopies ?? 0,
        stores: entry.storesWithStock ?? 0,
      });
    }

    stock.push({
      sourceKey,
      label: SOURCE_LABELS[sourceKey],
      online: latest?.online ?? "unknown",
      fetchedAt: latest?.fetchedAt ?? null,
      storeCount: latest?.storeCount ?? 0,
      storesWithStock: latest?.storesWithStock ?? 0,
      totalCopies: latest?.totalCopies ?? 0,
      note: latest?.note ?? null,
      history: [...byDay.values()],
    });
  }

  // ---- Butikker og fylker -------------------------------------------------
  const storeDocs = await payload.find({
    collection: "book-stores",
    limit: 1000,
    depth: 0,
    pagination: false,
    sort: "name",
  });
  const stores = (storeDocs.docs as BookStore[]).map((doc) =>
    toStoreRow(doc, recentActivity)
  );
  const regions = summarizeRegions(stores);

  if (stock.length > 0 && stock.every((entry) => entry.fetchedAt === null)) {
    warnings.push(
      "Ingen lagerbilder er hentet ennå. Første henting skjer i morgen tidlig, eller med «Hent nå»."
    );
  }

  // ---- Tidslinjer ---------------------------------------------------------
  // To adskilte serier, bevisst ikke slått sammen: den ene er penger inn, den
  // andre er etterspørsel ute i butikkene.
  const toTimeline = (byDay: Map<string, number>): TimelinePoint[] =>
    [...byDay.keys()]
      .sort()
      .slice(-90)
      .map((date) => ({ date, copies: byDay.get(date) ?? 0 }));

  const timeline = toTimeline(soldInByDay);
  const sellThroughTimeline = toTimeline(sellThroughByDay);
  const sellThroughTotal = [...sellThroughBySource.values()].reduce(
    (sum, value) => sum + value,
    0
  );

  // ---- Endringslogg -------------------------------------------------------
  const eventDocs = await payload.find({
    collection: "book-stock-events",
    sort: "-occurredAt",
    limit: 60,
    depth: 0,
  });
  const events: RecentEvent[] = (eventDocs.docs as BookStockEvent[]).map(
    (doc) => ({
      id: String(doc.id),
      occurredAt: doc.occurredAt,
      type: doc.type,
      sourceKey: doc.sourceKey,
      storeName: doc.storeName ?? null,
      city: doc.city ?? null,
      delta: doc.delta ?? 0,
      fromQty: doc.fromQty ?? null,
      toQty: doc.toQty ?? null,
      note: doc.note ?? null,
    })
  );

  // ---- Boka ---------------------------------------------------------------
  const releaseDate = economy.releaseDate ?? null;
  const daysUntilRelease = releaseDate
    ? Math.ceil(
        (new Date(releaseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const released = daysUntilRelease === null ? true : daysUntilRelease <= 0;

  // ---- Milepæler ----------------------------------------------------------
  const reached = milestones({
    copies: summed.copies,
    ownShopCopies: shopCopies,
    net: summed.net,
    expenses: expenseTotal,
    printRun: economy.printRun ?? null,
    released,
    storesWithBook: stores.filter((store) => store.currentQty > 0).length,
    regionsWithBook: regions.filter((region) => region.withStock > 0).length,
    regionsTotal: regions.filter((region) => region.region !== "Ukjent").length,
    sellThrough: sellThroughTotal,
  });

  return {
    book: {
      title: economy.title,
      isbn: economy.isbn,
      releaseDate,
      listPrice: settings.listPrice,
      printRun: economy.printRun ?? null,
      daysUntilRelease,
      released,
    },
    settings,
    channels: channelSummaries,
    totals: summed,
    coverage: coverage(summed, expenseTotal),
    returnable,
    milestones: reached,
    expenses: {
      total: expenseTotal,
      groups,
      missingPrintInvoice: printExpenses === 0,
    },
    stock,
    stores,
    regions,
    timeline,
    sellThroughTimeline,
    sellThroughTotal,
    events,
    warnings,
  };
}

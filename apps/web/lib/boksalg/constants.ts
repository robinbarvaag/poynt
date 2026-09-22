/**
 * Delte valglister for boksporinga. Admin-feltene, cron-jobben og dashbordet
 * leser alle herfra, slik at en ny kanal eller kategori ikke må endres tre
 * steder — og slik at nøklene som havner i databasen ikke kan drifte fra hver-
 * andre.
 */

/** Salgskanal. Nøkkelen lagres i databasen — ikke endre en som er i bruk. */
export const CHANNEL_KEYS = {
  norli: "norli",
  ark: "ark",
  egen: "egen",
  foredrag: "foredrag",
  direkte: "direkte",
  annet: "annet",
} as const;

export type ChannelKey = (typeof CHANNEL_KEYS)[keyof typeof CHANNEL_KEYS];

export const CHANNEL_OPTIONS: { label: string; value: ChannelKey }[] = [
  { label: "Norli", value: "norli" },
  { label: "ARK", value: "ark" },
  { label: "Egen nettbutikk", value: "egen" },
  { label: "Foredrag og kurs", value: "foredrag" },
  { label: "Direktesalg", value: "direkte" },
  { label: "Annet", value: "annet" },
];

/**
 * Standardoppsettet, som «Bokøkonomi» fylles med første gang. Norli og ARK tar
 * 50 %; egen nettbutikk har ingen forhandler, men Stripe tar 1,4 % + 2 kr.
 */
export const DEFAULT_CHANNELS = [
  {
    key: "norli",
    label: "Norli",
    retailerPercent: 50,
    stockSource: "norli",
    distributionPercent: 0,
    distributionPerCopy: 0,
    transactionPercent: 0,
    transactionPerCopy: 0,
    maxReturnPercent: 50,
    active: true,
  },
  {
    key: "ark",
    label: "ARK",
    retailerPercent: 50,
    stockSource: "ark",
    distributionPercent: 0,
    distributionPerCopy: 0,
    transactionPercent: 0,
    transactionPerCopy: 0,
    maxReturnPercent: 50,
    active: true,
  },
  {
    key: "egen",
    label: "Egen nettbutikk",
    retailerPercent: 0,
    stockSource: "none",
    distributionPercent: 0,
    distributionPerCopy: 0,
    transactionPercent: 1.4,
    transactionPerCopy: 2,
    maxReturnPercent: 0,
    active: true,
  },
  {
    key: "foredrag",
    label: "Foredrag og kurs",
    retailerPercent: 0,
    stockSource: "none",
    distributionPercent: 0,
    distributionPerCopy: 0,
    transactionPercent: 0,
    transactionPerCopy: 0,
    maxReturnPercent: 0,
    active: true,
  },
];

/** Kildene cron-jobben kan hente lagerstatus fra. */
export const SOURCE_OPTIONS = [
  { label: "Norli", value: "norli" },
  { label: "ARK", value: "ark" },
];

export const STOCK_SOURCE_OPTIONS = [
  { label: "Ingen – salg føres manuelt", value: "none" },
  ...SOURCE_OPTIONS,
];

export const EXPENSE_CATEGORIES = [
  { label: "Design og omslag", value: "design" },
  { label: "Redaktør", value: "redaktor" },
  { label: "Oversetter", value: "oversetter" },
  { label: "Trykkeri", value: "trykkeri" },
  { label: "Bokbasen", value: "bokbasen" },
  { label: "Forlagsentralen", value: "forlagsentralen" },
  { label: "Markedsføring", value: "markedsforing" },
  { label: "Lansering", value: "lansering" },
  { label: "Annet", value: "annet" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

/**
 * Hvor et manuelt registrert salg kommer fra. Alle disse er «solgt inn» —
 * øyeblikket Susanne faktisk får betalt. Når Norli kjøper 400 eksemplarer er
 * det 400 salg for henne, uavhengig av hvor fort de går ut av hylla etterpå.
 *
 * Unntaket er «retur»: bøker bokhandelen sender tilbake. Den raden trekkes fra
 * i stedet for å legges til — og fra innkjøpet, for det er innkjøpet som har
 * returrett, ikke bøker som allerede er solgt til en kunde.
 */
export const SALE_SOURCE_OPTIONS = [
  { label: "Innkjøp fra bokhandel", value: "innkjop" },
  { label: "Forhåndssalg", value: "forhandssalg" },
  { label: "Avregning fra distributør", value: "avregning" },
  { label: "Solgt på foredrag", value: "foredrag" },
  { label: "Direktesalg", value: "direkte" },
  { label: "Retur fra bokhandel", value: "retur" },
  { label: "Annet", value: "annet" },
] as const;

export type SaleSource = (typeof SALE_SOURCE_OPTIONS)[number]["value"];

/**
 * Forklaring per salgstype, i hverdagsspråk. Vises under feltet i admin
 * (`admin/components/sale-source-help.tsx`) — hold dem her sammen med lista,
 * så en ny type ikke kan mangle forklaring.
 */
export const SALE_SOURCE_HELP: Record<SaleSource, string> = {
  innkjop:
    "Norli eller ARK har bestilt et antall bøker. Dette er bøkene de kan sende tilbake.",
  forhandssalg:
    "Kunder bestilte boka før lansering, og bokhandelen bestilte ekstra for dem. Kommer ikke i retur.",
  avregning:
    "Oppgjøret fra Forlagsentralen. Bruk bare hvis du ikke har ført innkjøpene enkeltvis — ellers telles bøkene to ganger.",
  foredrag: "Bøker du solgte selv på foredrag eller kurs.",
  direkte: "Solgt rett til en bedrift eller person, utenom nettbutikken.",
  retur: "Bøker som kom tilbake fra bokhandelen. Trekkes fra.",
  annet: "Alt som ikke passer over. Skriv hva det var i referansefeltet.",
};

/** Salgstypen som trekkes fra i stedet for å legges til. */
export const RETURN_SOURCE: SaleSource = "retur";

/**
 * Salgstypene bokhandelen kan returnere fra. Forhåndssalg og avregninger er
 * bøker som allerede har gått til en kunde — de kommer ikke tilbake.
 */
export const RETURNABLE_SOURCES: readonly SaleSource[] = ["innkjop"];

export const AVAILABILITY_OPTIONS = [
  { label: "Ukjent", value: "unknown" },
  { label: "Ikke i katalogen", value: "not_listed" },
  { label: "Forhåndssalg", value: "preorder" },
  { label: "I salg", value: "in_stock" },
  { label: "Utsolgt", value: "out_of_stock" },
];

/**
 * Susannes oppfølging per butikk. Lagres på butikkraden og røres aldri av den
 * automatiske hentingen.
 */
export const FOLLOW_UP_OPTIONS = [
  { label: "Ikke kontaktet", value: "ingen" },
  { label: "Kontaktet – venter svar", value: "kontaktet" },
  { label: "Sa ja – tar inn boka", value: "ja" },
  { label: "Sa nei", value: "nei" },
  { label: "Følg opp igjen", value: "purr" },
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_OPTIONS)[number]["value"];

/**
 * Lagerstatus for én butikk, utledet av tallene — ikke lagret. «Gått tom» og
 * «ikke hatt» skilles på om butikken NOEN GANG har hatt boka i en måling.
 */
export type StoreStatus = "har_boka" | "gatt_tom" | "ikke_hatt";

export function storeStatus(currentQty: number, maxQty: number): StoreStatus {
  if (currentQty > 0) return "har_boka";
  if (maxQty > 0) return "gatt_tom";
  return "ikke_hatt";
}

export const STORE_STATUS_OPTIONS: { label: string; value: StoreStatus }[] = [
  { label: "Har boka", value: "har_boka" },
  { label: "Gått tom", value: "gatt_tom" },
  { label: "Ikke hatt boka", value: "ikke_hatt" },
];

export const STOCK_EVENT_OPTIONS = [
  { label: "Salg", value: "sale" },
  { label: "Påfyll", value: "restock" },
  { label: "Kom i butikk", value: "listed" },
  { label: "Forsvant fra lista", value: "delisted" },
  { label: "Utsolgt", value: "sold_out" },
  { label: "Statusendring", value: "availability" },
];

/** Norsk etikett for en verdi i en av listene over. */
export function labelFor(
  options: { label: string; value: string }[],
  value: string | null | undefined
): string {
  if (!value) return "–";
  return options.find((option) => option.value === value)?.label ?? value;
}

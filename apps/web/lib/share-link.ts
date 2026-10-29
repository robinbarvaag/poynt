/**
 * Delingslenker med UTM-merking. Susanne velger *hvor* hun skal dele
 * («Instagram-story», «Nyhetsbrev» …) og får en lenke som er merket slik at
 * Vercel Analytics (fanen «UTM Parameters») og GA4 skiller kanalene fra
 * hverandre — uten at hun trenger å vite hva UTM er.
 *
 * - utm_source:   plattformen (instagram, facebook …)
 * - utm_medium:   hvor på plattformen (story, bio, annonse …)
 * - utm_campaign: siden som deles (siste del av stien, f.eks. boka)
 * - utm_content:  datoen lenken ble laget — skiller to stories om samme side
 *
 * Brukes av «Del-lenke» i admin-headeren og i admin-pillen på nettsiden.
 */

export type ShareChannel = {
  key: string;
  label: string;
  /** Kort hint under valget — hvor lenken limes inn. */
  hint: string;
  source: string;
  medium: string;
};

export const SHARE_CHANNELS: readonly ShareChannel[] = [
  {
    key: "instagram-story",
    label: "Instagram-story",
    hint: "Lenke-klistremerket i storyen",
    source: "instagram",
    medium: "story",
  },
  {
    key: "instagram-bio",
    label: "Instagram-bio",
    hint: "Lenken i profilen («lenke i bio»)",
    source: "instagram",
    medium: "bio",
  },
  {
    key: "facebook",
    label: "Facebook-innlegg",
    hint: "Innlegg på siden eller i en gruppe",
    source: "facebook",
    medium: "innlegg",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    hint: "Innlegg eller profil",
    source: "linkedin",
    medium: "innlegg",
  },
  {
    key: "annonse",
    label: "Betalt annonse",
    hint: "Annonse eller «boost» i Meta",
    source: "meta",
    medium: "annonse",
  },
  {
    key: "nyhetsbrev",
    label: "Nyhetsbrev",
    hint: "Lenke i nyhetsbrevet",
    source: "nyhetsbrev",
    medium: "e-post",
  },
  {
    key: "melding",
    label: "Melding / e-post",
    hint: "Til én person: SMS, Messenger, e-post",
    source: "direkte",
    medium: "melding",
  },
];

/** «/produkter/verdifull-vekst» → «verdifull-vekst», «/» → «forside». */
export function campaignFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments.at(-1) ?? "forside";
}

/** «2026-10-29» i norsk tid. */
function todayInOslo(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(now);
}

/**
 * Bygger delingslenken. Eksisterende query-parametre beholdes, men gamle
 * utm_* fjernes så lenker kopiert fra en allerede merket side ikke blandes.
 */
export function buildShareUrl(
  pageUrl: string,
  channel: ShareChannel,
  now: Date = new Date()
): string {
  const url = new URL(pageUrl);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || key === "fbclid" || key === "gclid") {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.set("utm_source", channel.source);
  url.searchParams.set("utm_medium", channel.medium);
  url.searchParams.set("utm_campaign", campaignFromPath(url.pathname));
  url.searchParams.set("utm_content", todayInOslo(now));
  return url.toString();
}

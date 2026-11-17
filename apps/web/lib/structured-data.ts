import type { MediaResource } from "@/components/payload-image";
import { resolveMediaUrl } from "@/components/payload-image";
import { SITE_NAME, SITE_URL } from "./seo";

type MediaInput = MediaResource | number | null | undefined;

/**
 * JSON-LD krever absolutte URL-er. `resolveMediaUrl` gir host-relative stier
 * for app-servert media, så vi setter på `SITE_URL` her.
 */
function absoluteMediaUrl(media: MediaInput | string): string | undefined {
  const url = resolveMediaUrl(media);
  if (!url) {
    return undefined;
  }
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

/** Stabile `@id`-er, så noder på tvers av sider kan referere til hverandre. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;
const LOGO_ID = `${SITE_URL}/#logo`;

/**
 * «Om»-siden er grunnleggerens profilside. Stien er fast (CMS-siden med slug
 * `om`), så forfatterlenker og Person-noden kan peke hit uten et eget felt.
 */
export const ABOUT_SLUG = "om";
export const ABOUT_PATH = `/${ABOUT_SLUG}`;
const ABOUT_URL = `${SITE_URL}${ABOUT_PATH}`;

const nonEmpty = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim() !== "";

/**
 * Norsk adresse fra ett tekstfelt («Gate 1\n4006 Stavanger») → PostalAddress.
 * Linja med firesifret postnummer blir postnummer + sted; resten er gateadresse.
 */
export function parseNorwegianAddress(address: string): {
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
} {
  const lines = address
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
  const postalIndex = lines.findLastIndex((line) =>
    /^(?:NO-)?\d{4}\s+\S/.test(line)
  );
  if (postalIndex === -1) {
    return lines.length ? { streetAddress: lines.join(", ") } : {};
  }
  const match = /^(?:NO-)?(\d{4})\s+(.+)$/.exec(lines[postalIndex]);
  const street = lines.filter((_, i) => i !== postalIndex).join(", ");
  return {
    ...(street ? { streetAddress: street } : {}),
    ...(match ? { postalCode: match[1], addressLocality: match[2] } : {}),
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Finnes datoen i kalenderen? (31.02 og måned 13 gjør ikke det.) */
function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const osloDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * schema.org vil ha datoer som ISO 8601. Feltene i admin er fritekst eller
 * Payload-datoer, så vi godtar det folk faktisk skriver: `2023-01-25`,
 * `25.01.2023` (norsk skrivemåte), bare årstall (`2023`) og fulle tidsstempler
 * (leses som dato i norsk tid). Alt annet gir `undefined`, så egenskapen
 * utelates i stedet for å sendes ut som noe søkemotorene ikke kan tolke.
 */
export function toIsoDate(
  value: string | null | undefined
): string | undefined {
  if (!nonEmpty(value)) return undefined;
  const text = value.trim();

  if (/^\d{4}$/.test(text)) return text;

  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(text);
  if (iso) {
    const month = Number(iso[2]);
    if (iso[3] === undefined) {
      return month >= 1 && month <= 12 ? text : undefined;
    }
    return isRealDate(Number(iso[1]), month, Number(iso[3])) ? text : undefined;
  }

  const norwegian = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  if (norwegian) {
    const day = Number(norwegian[1]);
    const month = Number(norwegian[2]);
    const year = Number(norwegian[3]);
    return isRealDate(year, month, day)
      ? `${year}-${pad2(month)}-${pad2(day)}`
      : undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : osloDate.format(date);
  }

  return undefined;
}

/** Fakta om bedriften fra «Bedrift»-fanen i nettsted-innstillingene. */
export interface CompanyInfo {
  legalName?: string | null;
  orgNumber?: string | null;
  foundingDate?: string | null;
  areaServed?: string | null;
  slogan?: string | null;
  knowsAbout?: { topic?: string | null }[] | null;
  founder?: {
    name?: string | null;
    jobTitle?: string | null;
    description?: string | null;
    image?: MediaInput;
    sameAs?: { url?: string | null }[] | null;
  } | null;
}

export type FounderInfo = NonNullable<CompanyInfo["founder"]>;

/**
 * Personen bak bedriften, som egen node. Samme `@id` overalt, så forfatter på
 * artikler, forfatter av boka og hovedpersonen på «Om»-siden blir én og samme
 * enhet for søkemotorer og AI-tjenester. `null` uten navn.
 */
export function founderSchema(founder: FounderInfo | null | undefined) {
  if (!nonEmpty(founder?.name)) return null;
  const image = absoluteMediaUrl(founder.image);
  const sameAs = (founder.sameAs ?? []).map((s) => s.url).filter(nonEmpty);

  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: founder.name.trim(),
    url: ABOUT_URL,
    ...(nonEmpty(founder.jobTitle) ? { jobTitle: founder.jobTitle } : {}),
    ...(nonEmpty(founder.description)
      ? { description: founder.description }
      : {}),
    ...(image ? { image } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    worksFor: { "@id": ORG_ID },
  };
}

/**
 * Kort henvisning til grunnleggeren (forfatter-felt). Navn og url gjentas med
 * vilje: Google krever `author.name` på artikler og anbefaler `author.url`,
 * og ikke alle lesere slår sammen noder på tvers av script-blokker.
 */
export function founderReference(founder: FounderInfo | null | undefined) {
  if (!nonEmpty(founder?.name)) return null;
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: founder.name.trim(),
    url: ABOUT_URL,
  };
}

/**
 * Organisasjonen bak nettstedet. Bygges fra `site-settings` og fungerer som
 * felles «avsender» (publisher/provider/brand) for resten av den strukturerte
 * dataen. Jo mer entydig bedriften er beskrevet (juridisk navn, org.nr.,
 * grunnlegger, profiler), jo tryggere kobler søkemotorer og AI-tjenester
 * omtaler av Poynt til riktig enhet.
 */
export function organizationSchema(opts: {
  name?: string | null;
  description?: string | null;
  logo?: MediaInput | string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  socialLinks?: { platform?: string; url?: string | null }[] | null;
  company?: CompanyInfo | null;
}) {
  const company = opts.company ?? {};
  const name = opts.name || SITE_NAME;
  const orgNumber = company.orgNumber?.replace(/\D/g, "");
  const logoUrl = absoluteMediaUrl(opts.logo);
  const logoSize =
    opts.logo && typeof opts.logo === "object"
      ? { width: opts.logo.width, height: opts.logo.height }
      : {};

  const sameAs = [
    ...(opts.socialLinks ?? []).map((s) => s.url),
    // Brønnøysundregistrene er den autoritative kilden for norske foretak.
    orgNumber?.length === 9
      ? `https://virksomhet.brreg.no/nb/oppslag/enheter/${orgNumber}`
      : null,
  ].filter(nonEmpty);

  const founder = founderSchema(company.founder);
  const foundingDate = toIsoDate(company.foundingDate);
  const knowsAbout = (company.knowsAbout ?? [])
    .map((k) => k.topic)
    .filter(nonEmpty);
  const address = opts.address ? parseNorwegianAddress(opts.address) : {};

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name,
    url: SITE_URL,
    ...(nonEmpty(company.legalName) ? { legalName: company.legalName } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(nonEmpty(company.slogan) ? { slogan: company.slogan } : {}),
    ...(logoUrl
      ? {
          logo: {
            "@type": "ImageObject",
            "@id": LOGO_ID,
            url: logoUrl,
            contentUrl: logoUrl,
            caption: name,
            ...(logoSize.width ? { width: logoSize.width } : {}),
            ...(logoSize.height ? { height: logoSize.height } : {}),
          },
          image: { "@id": LOGO_ID },
        }
      : {}),
    ...(opts.email ? { email: opts.email } : {}),
    ...(opts.phone ? { telephone: opts.phone } : {}),
    ...(orgNumber
      ? {
          taxID: orgNumber,
          identifier: {
            "@type": "PropertyValue",
            propertyID: "Organisasjonsnummer (Brønnøysundregistrene)",
            value: orgNumber,
          },
        }
      : {}),
    ...(foundingDate ? { foundingDate } : {}),
    areaServed: {
      "@type": "Country",
      name: company.areaServed?.trim() || "Norge",
    },
    ...(knowsAbout.length ? { knowsAbout } : {}),
    ...(founder ? { founder } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(opts.email || opts.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["Norwegian"],
            areaServed: "NO",
            ...(opts.email ? { email: opts.email } : {}),
            ...(opts.phone ? { telephone: opts.phone } : {}),
          },
        }
      : {}),
    ...(Object.keys(address).length
      ? {
          address: {
            "@type": "PostalAddress",
            ...address,
            addressCountry: "NO",
          },
        }
      : {}),
  };
}

/** Selve nettstedet. Refererer til organisasjonen som utgiver. */
export function websiteSchema(opts: {
  name?: string | null;
  description?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: opts.name || SITE_NAME,
    url: SITE_URL,
    ...(opts.description ? { description: opts.description } : {}),
    publisher: { "@id": ORG_ID },
    inLanguage: "nb-NO",
  };
}

/**
 * «Om»-siden: profilside med grunnleggeren som hovedperson. `ProfilePage` er
 * typen Google dokumenterer for «om meg»-sider; `AboutPage` sier det samme til
 * alle som leser schema.org. Brukes bare der siden faktisk presenterer
 * personen — `null` uten navn i «Bedrift»-fanen.
 */
export function aboutPageSchema(opts: {
  name: string;
  description?: string | null;
  founder: FounderInfo | null | undefined;
  dateCreated?: string | null;
  dateModified?: string | null;
}) {
  const person = founderSchema(opts.founder);
  if (!person) return null;

  return {
    "@context": "https://schema.org",
    "@type": ["ProfilePage", "AboutPage"],
    "@id": `${ABOUT_URL}#webpage`,
    url: ABOUT_URL,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.dateCreated ? { dateCreated: opts.dateCreated } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    mainEntity: person,
    about: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "nb-NO",
  };
}

/**
 * Bloggartikkel / redaksjonelt innhold. Forfatteren er en person når vi vet
 * hvem (grunnleggeren fra «Bedrift»-fanen) — det er personen, ikke firmaet,
 * som bærer faglig troverdighet. Organisasjonen er alltid utgiver.
 */
export function articleSchema(opts: {
  /** `BlogPosting` for blogginnlegg, `Article` for annet redaksjonelt. */
  type?: "Article" | "BlogPosting";
  title: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  /** Grunnleggeren fra nettsted-innstillingene — gir forfatter med `@id`. */
  author?: FounderInfo | null;
  authorName?: string | null;
  /** Kategorinavn, slik de vises som merkelapper på siden. */
  sections?: (string | null | undefined)[] | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);
  const sections = (opts.sections ?? []).filter(nonEmpty);
  const author =
    founderReference(opts.author) ??
    (nonEmpty(opts.authorName)
      ? { "@type": "Person", name: opts.authorName }
      : {
          "@type": "Organization",
          "@id": ORG_ID,
          name: SITE_NAME,
          url: SITE_URL,
        });

  return {
    "@context": "https://schema.org",
    "@type": opts.type ?? "Article",
    headline: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    url: opts.url,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    ...(sections.length ? { articleSection: sections } : {}),
    author,
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "nb-NO",
  };
}

/** Tjeneste med tilbyder og (valgfri) pris. */
export function serviceSchema(opts: {
  name: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  price?: number | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    url: opts.url,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Norge" },
    ...(typeof opts.price === "number"
      ? {
          offers: {
            "@type": "Offer",
            price: opts.price,
            priceCurrency: "NOK",
            seller: { "@id": ORG_ID },
          },
        }
      : {}),
  };
}

/** Det vi vet om boka: fra «Bokøkonomi» + grunnleggeren som forfatter. */
export interface BookInfo {
  isbn?: string | null;
  /** Utgivelsesdato (Payload-dato eller ISO). */
  datePublished?: string | null;
  author?: FounderInfo | null;
}

/** ISBN skrives ofte med bindestreker; schema.org vil ha bare sifrene. */
export function normalizeIsbn(
  value: string | null | undefined
): string | undefined {
  const digits = value?.replace(/[\s-]/g, "") ?? "";
  return /^(?:\d{13}|\d{9}[\dXx])$/.test(digits)
    ? digits.toUpperCase()
    : undefined;
}

/**
 * Produkt med pris og tilgjengelighet. Med `book` blir noden både `Product`
 * og `Book` — slik Google ber om for bøker med ISBN — og får forfatter,
 * utgiver og utgivelsesdato. Bare felt vi faktisk har sendes ut.
 */
export function productSchema(opts: {
  name: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  price?: number | null;
  book?: BookInfo | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);
  const book = opts.book;
  const isbn = normalizeIsbn(book?.isbn);
  const bookAuthor = founderReference(book?.author);
  const datePublished = toIsoDate(book?.datePublished);

  return {
    "@context": "https://schema.org",
    "@type": book ? ["Product", "Book"] : "Product",
    ...(book ? { "@id": `${opts.url}#book` } : {}),
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    url: opts.url,
    brand: { "@id": ORG_ID },
    ...(book
      ? {
          ...(isbn ? { isbn } : {}),
          ...(bookAuthor ? { author: bookAuthor } : {}),
          // Poynt gir ut boka selv (Poynt forlag), jf. docs/BOKSALG.md.
          publisher: { "@id": ORG_ID },
          ...(datePublished ? { datePublished } : {}),
          inLanguage: "nb",
        }
      : {}),
    ...(typeof opts.price === "number"
      ? {
          offers: {
            "@type": "Offer",
            price: opts.price,
            priceCurrency: "NOK",
            availability: "https://schema.org/InStock",
            url: opts.url,
            seller: { "@id": ORG_ID },
          },
        }
      : {}),
  };
}

/**
 * Event (arrangement). Google viser eventer med dato, sted og pris direkte i
 * søkeresultatet, og AI-assistenter bruker det samme til å svare på «hva skjer
 * i Stavanger i oktober?».
 */
export function eventSchema(opts: {
  name: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  startDate: string;
  endDate?: string | null;
  status?: "scheduled" | "postponed" | "cancelled" | null;
  location?: {
    name?: string | null;
    address?: string | null;
    online?: boolean | null;
  } | null;
  /** Billetter via nettsiden: ledig, fullt (venteliste) eller ikke åpnet. */
  availability?: "InStock" | "SoldOut" | "PreOrder" | null;
  /** Når påmeldingen åpnet. */
  validFrom?: string | null;
  /** Lenke til påmeldingen (egen side eller eksternt billettsystem). */
  offerUrl?: string | null;
  /** Pris per person i kr (0 = gratis). Utelatt = ukjent (eksternt billettsystem). */
  price?: number | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);
  const online = Boolean(opts.location?.online);
  const knownPrice = typeof opts.price === "number" ? opts.price : null;
  const address = opts.location?.address
    ? parseNorwegianAddress(opts.location.address)
    : {};
  const statusMap = {
    scheduled: "https://schema.org/EventScheduled",
    postponed: "https://schema.org/EventPostponed",
    cancelled: "https://schema.org/EventCancelled",
  } as const;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    url: opts.url,
    startDate: opts.startDate,
    ...(opts.endDate ? { endDate: opts.endDate } : {}),
    eventStatus: statusMap[opts.status ?? "scheduled"],
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: online
      ? { "@type": "VirtualLocation", url: opts.url }
      : {
          "@type": "Place",
          ...(nonEmpty(opts.location?.name)
            ? { name: opts.location.name }
            : {}),
          address: {
            "@type": "PostalAddress",
            ...address,
            addressCountry: "NO",
          },
        },
    organizer: { "@id": ORG_ID },
    ...(opts.availability
      ? {
          ...(knownPrice !== null
            ? { isAccessibleForFree: knownPrice === 0 }
            : {}),
          offers: {
            "@type": "Offer",
            ...(knownPrice !== null ? { price: knownPrice } : {}),
            priceCurrency: "NOK",
            availability: `https://schema.org/${opts.availability}`,
            url: opts.offerUrl || opts.url,
            ...(opts.validFrom ? { validFrom: opts.validFrom } : {}),
          },
        }
      : {}),
    inLanguage: "nb-NO",
  };
}

/** Brødsmulesti for detaljsider. */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ-strukturert data. Sterkt signal for både Google-rike-resultater og
 * generative søkemotorer (GEO). Returnerer `null` når det ikke finnes spørsmål,
 * så kallstedet kan filtrere det bort.
 */
export function faqSchema(
  items:
    | { question?: string | null; answer?: string | null }[]
    | null
    | undefined
) {
  const entries = (items ?? []).filter(
    (i): i is { question: string; answer: string } =>
      Boolean(i.question) && Boolean(i.answer)
  );
  if (!entries.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

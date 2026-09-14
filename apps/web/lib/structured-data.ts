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

  const founder = company.founder;
  const founderImage = absoluteMediaUrl(founder?.image);
  const founderSameAs = (founder?.sameAs ?? [])
    .map((s) => s.url)
    .filter(nonEmpty);
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
    ...(nonEmpty(company.foundingDate)
      ? { foundingDate: company.foundingDate.trim() }
      : {}),
    areaServed: {
      "@type": "Country",
      name: company.areaServed?.trim() || "Norge",
    },
    ...(knowsAbout.length ? { knowsAbout } : {}),
    ...(nonEmpty(founder?.name)
      ? {
          founder: {
            "@type": "Person",
            "@id": FOUNDER_ID,
            name: founder.name,
            ...(nonEmpty(founder.jobTitle)
              ? { jobTitle: founder.jobTitle }
              : {}),
            ...(nonEmpty(founder.description)
              ? { description: founder.description }
              : {}),
            ...(founderImage ? { image: founderImage } : {}),
            ...(founderSameAs.length ? { sameAs: founderSameAs } : {}),
            worksFor: { "@id": ORG_ID },
          },
        }
      : {}),
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

/** Bloggartikkel / redaksjonelt innhold. */
export function articleSchema(opts: {
  title: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    url: opts.url,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    author: opts.authorName
      ? { "@type": "Person", name: opts.authorName }
      : {
          "@type": "Organization",
          "@id": ORG_ID,
          name: SITE_NAME,
          url: SITE_URL,
        },
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

/** Digitalt produkt med pris og tilgjengelighet. */
export function productSchema(opts: {
  name: string;
  description?: string | null;
  image?: MediaInput | string;
  url: string;
  price?: number | null;
}) {
  const imageUrl = absoluteMediaUrl(opts.image);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    url: opts.url,
    brand: { "@id": ORG_ID },
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

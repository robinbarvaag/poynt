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

/** Stabil `@id` for organisasjonen, så andre noder kan referere til den. */
const ORG_ID = `${SITE_URL}/#organization`;

/**
 * Organisasjonen bak nettstedet. Bygges fra `site-settings` og fungerer som
 * felles «avsender» for resten av den strukturerte dataen.
 */
export function organizationSchema(opts: {
  name?: string | null;
  description?: string | null;
  logo?: MediaInput | string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  socialLinks?: { platform?: string; url?: string | null }[] | null;
}) {
  const sameAs = (opts.socialLinks ?? [])
    .map((s) => s.url)
    .filter((url): url is string => Boolean(url));
  const logoUrl = absoluteMediaUrl(opts.logo);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: opts.name || SITE_NAME,
    url: SITE_URL,
    ...(opts.description ? { description: opts.description } : {}),
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(opts.email || opts.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(opts.email ? { email: opts.email } : {}),
            ...(opts.phone ? { telephone: opts.phone } : {}),
          },
        }
      : {}),
    ...(opts.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: opts.address,
            addressCountry: "NO",
          },
        }
      : {}),
  };
}

/** Selve nettstedet. Refererer til organisasjonen som utgiver. */
export function websiteSchema(opts: { name?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: opts.name || SITE_NAME,
    url: SITE_URL,
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
    author: {
      "@type": opts.authorName ? "Person" : "Organization",
      name: opts.authorName || SITE_NAME,
    },
    publisher: { "@id": ORG_ID },
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
    areaServed: "NO",
    ...(typeof opts.price === "number"
      ? {
          offers: {
            "@type": "Offer",
            price: opts.price,
            priceCurrency: "NOK",
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
          },
        }
      : {}),
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

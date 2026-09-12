import { getPublicPath } from "@/lib/public-path";

/**
 * Felles modell for lenker satt inn i Lexical-editoren («Sett inn lenke»).
 *
 * Redaktøren velger lenketype i admin (se `link-feature.ts`); her ligger
 * logikken som gjør feltene om til noe frontend kan rendre. Brukes både av
 * JSX-konverterne (`components/rich-text/`) og av markdown-eksporten, så
 * begge tolker lenkene likt.
 */
export type LexicalLinkType =
  | "custom"
  | "internal"
  | "home"
  | "email"
  | "phone";

export interface LexicalLinkFields {
  linkType?: string | null;
  url?: string | null;
  email?: string | null;
  phone?: string | null;
  newTab?: boolean | null;
  doc?: {
    relationTo: string;
    value: unknown;
  } | null;
}

export type ResolvedLink =
  /** Side på eget nettsted (også forsiden og relative nettadresser). */
  | { kind: "internal"; href: string; newTab: boolean }
  /** Annet nettsted — åpnes alltid i ny fane med ekstern-ikon. */
  | { kind: "external"; href: string }
  /** E-postadresse — får popover med «send» og «kopier». */
  | { kind: "email"; href: string; value: string }
  /** Telefonnummer — får popover med «ring» og «kopier». */
  | { kind: "phone"; href: string; value: string };

/** `tel:`-lenke uten mellomrom og skilletegn, men med eventuell landkode. */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function emailHref(email: string): string {
  return `mailto:${email.trim()}`;
}

function sameHost(a: string, b: string): boolean {
  const strip = (host: string) => host.toLowerCase().replace(/^www\./, "");
  return strip(a) === strip(b);
}

/**
 * Peker nettadressen ut av eget nettsted? Relative adresser (`/om`, `#topp`)
 * og adresser på samme host som `siteUrl` regnes som interne.
 */
export function isExternalUrl(url: string, siteUrl?: string): boolean {
  const trimmed = url.trim();
  if (/^(?:\/(?!\/)|#|\?)/.test(trimmed)) return false;
  if (/^www\./i.test(trimmed)) return true;
  let target: URL;
  try {
    // Protokoll-relative adresser («//cdn.example.com») får skjemaet fra sida.
    target = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
  } catch {
    // Ikke absolutt (f.eks. «kontakt») — behandles som relativ.
    return false;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return true;
  }
  if (!siteUrl) return true;
  try {
    return !sameHost(target.host, new URL(siteUrl).host);
  } catch {
    return true;
  }
}

function docSlug(doc: LexicalLinkFields["doc"]): string | null {
  const value = doc?.value;
  if (value && typeof value === "object" && "slug" in value) {
    const slug = (value as { slug?: unknown }).slug;
    return typeof slug === "string" ? slug : null;
  }
  return null;
}

/**
 * Gjør lenkefeltene om til href + type. Returnerer null når lenka ikke kan
 * løses (f.eks. intern lenke der dokumentet ikke er populert eller er slettet)
 * — da bør teksten vises uten lenke i stedet for et dødt `#`.
 */
export function resolveLexicalLink(
  fields: LexicalLinkFields | null | undefined,
  options: { siteUrl?: string } = {}
): ResolvedLink | null {
  if (!fields) return null;
  const newTab = Boolean(fields.newTab);

  switch (fields.linkType) {
    case "home":
      return { kind: "internal", href: "/", newTab };

    case "internal": {
      const relationTo = fields.doc?.relationTo;
      const href = relationTo
        ? getPublicPath(relationTo, docSlug(fields.doc))
        : null;
      return href ? { kind: "internal", href, newTab } : null;
    }

    case "email": {
      const email = fields.email?.trim();
      return email
        ? { kind: "email", href: emailHref(email), value: email }
        : null;
    }

    case "phone": {
      const phone = fields.phone?.trim();
      return phone
        ? { kind: "phone", href: phoneHref(phone), value: phone }
        : null;
    }

    default: {
      // «custom» og autolenker (limt inn URL). Gamle lenker skrevet som
      // mailto:/tel: rett i URL-feltet får samme oppførsel som de nye typene.
      const url = fields.url?.trim();
      if (!url) return null;
      const mailto = /^mailto:([^?]+)/i.exec(url);
      if (mailto?.[1]) {
        const value = decodeURIComponent(mailto[1]);
        return { kind: "email", href: emailHref(value), value };
      }
      const tel = /^tel:(.+)$/i.exec(url);
      if (tel?.[1]) {
        const value = decodeURIComponent(tel[1]);
        return { kind: "phone", href: phoneHref(value), value };
      }
      if (isExternalUrl(url, options.siteUrl)) {
        return { kind: "external", href: url };
      }
      return { kind: "internal", href: url, newTab };
    }
  }
}

/** Kun href — for markdown-eksport og andre tekstlige varianter. */
export function lexicalLinkHref(
  fields: LexicalLinkFields | null | undefined,
  options: { siteUrl?: string } = {}
): string | null {
  return resolveLexicalLink(fields, options)?.href ?? null;
}

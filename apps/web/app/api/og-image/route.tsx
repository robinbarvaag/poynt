import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import type { ReactElement } from "react";

/**
 * Dynamisk delingsbilde (Open Graph) i merkevaren: alltid nøyaktig 1200×630
 * (1,91:1), lett PNG, med logo, tydelig overskrift og CTA — det plattformene
 * (og meta-tag-inspektører) ser etter.
 *
 * Styres fra Nettsted-innstillinger → «Delingsbilder» (logo, CTA-tekst, stil):
 * - Uten `img`: merkevare-kort med logo, tittel, CTA og dekor.
 * - Med `img` + foto-aktig aspekt: `overlay`-stil = bildet i full bredde med
 *   mørk gradient og tekst oppå; `panel`-stil = tekst venstre, bilde høyre.
 * - Med `img` + `fit=contain` (logoer/uvanlige formater): alltid panel, så
 *   ingenting av bildet kuttes.
 *
 * `img` godtas kun fra egne kilder (samme origin / Vercel Blob) — ruten skal
 * ikke kunne brukes til å proxye vilkårlige URL-er.
 *
 * Farger fra den offisielle paletten (tooling/tailwind/web.css):
 * Azure #f2fafa, Forrest #004029, Castelton #29664f, Saffron #eac435,
 * Salmon #ff99ad, Celeste #abe3e3, Platinum #d7e1de.
 */

const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

/**
 * Henter et bilde og pakker det som data-URL. Satori (ImageResponse) fetcher
 * ellers `<img src>` selv midt i renderingen, og én feilet fetch (død vert,
 * SSO-beskyttet deploy-URL, timeout) velter hele responsen som 500. Ved å hente
 * selv kan vi i stedet degradere pent: `null` → kortet rendres uten bildet.
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!(res.ok && type.startsWith("image/"))) {
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function isAllowedImageSource(url: string): boolean {
  try {
    const parsed = new URL(url, SITE_URL);
    const site = new URL(SITE_URL);
    return (
      parsed.origin === site.origin ||
      parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

type LogoInfo = {
  url: string;
  width: number | null;
  height: number | null;
};

/** Delingskort-innstillingene fra Nettsted-innstillinger, cachet som layouten. */
const getShareCardSettings = unstable_cache(
  async () => {
    try {
      const payload = await getPayload({ config });
      const settings = await payload.findGlobal({
        slug: "site-settings",
        depth: 1,
      });
      const pick = (media: unknown): LogoInfo | null => {
        if (media && typeof media === "object" && "url" in media) {
          const m = media as {
            url?: string | null;
            width?: number | null;
            height?: number | null;
          };
          return m.url
            ? { url: m.url, width: m.width ?? null, height: m.height ?? null }
            : null;
        }
        return null;
      };
      const ogLogo = pick(settings?.ogLogo);
      const generalLogo = pick(settings?.logo);
      return {
        logo: ogLogo ?? generalLogo,
        // Alle kjente logo-URL-er: et delingsbilde som ER logoen skal ikke
        // vises i panel (dobbel logo) — da brukes det rene merkekortet.
        knownLogoPaths: [ogLogo?.url, generalLogo?.url]
          .filter((u): u is string => Boolean(u))
          .map((u) => new URL(u, SITE_URL).pathname),
        ctaText: settings?.ogCtaText || "Les mer på poynt.no",
        style: settings?.ogStyle === "panel" ? "panel" : "overlay",
      };
    } catch {
      return {
        logo: null,
        knownLogoPaths: [] as string[],
        ctaText: "Les mer på poynt.no",
        style: "overlay",
      };
    }
  },
  ["og-share-card-settings"],
  { revalidate: 60, tags: ["globals"] }
);

/** Logo fra innstillingene, eller tekst-ordmerke som fallback. */
function Brand({ logo, onDark }: { logo: LogoInfo | null; onDark: boolean }) {
  if (logo) {
    // Satori støtter ikke objectPosition, så chipen dimensjoneres etter
    // logoens faktiske proporsjoner — ingen død luft rundt smale/kvadratiske
    // logoer.
    const logoHeight = 44;
    const ratio = logo.width && logo.height ? logo.width / logo.height : 1;
    const logoWidth = Math.round(
      Math.min(320, Math.max(logoHeight, logoHeight * ratio))
    );
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: onDark ? "rgba(242,250,250,0.94)" : "transparent",
          borderRadius: onDark ? 14 : 0,
          padding: onDark ? "14px 24px" : 0,
        }}
      >
        <img
          src={logo.url}
          alt=""
          style={{
            width: logoWidth,
            height: logoHeight,
            objectFit: "contain",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        fontSize: 34,
        fontWeight: 700,
        color: onDark ? "#f2fafa" : "#004029",
      }}
    >
      Poynt
    </div>
  );
}

function Cta({ text, onDark }: { text: string; onDark: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: onDark ? "#f2fafa" : "#29664f",
          color: onDark ? "#004029" : "#f2fafa",
          borderRadius: 9999,
          padding: "16px 36px",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        {text} →
      </div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const rawTitle = req.nextUrl.searchParams.get("title")?.trim() || "Poynt";
  // Klipp ekstremt lange titler så layouten aldri sprenges.
  const title = rawTitle.length > 120 ? `${rawTitle.slice(0, 117)}…` : rawTitle;

  const imgParam = req.nextUrl.searchParams.get("img")?.trim();
  let img =
    imgParam && isAllowedImageSource(imgParam)
      ? new URL(imgParam, SITE_URL).href
      : undefined;
  const fit =
    req.nextUrl.searchParams.get("fit") === "cover" ? "cover" : "contain";

  const { logo, knownLogoPaths, ctaText, style } = await getShareCardSettings();

  // Er delingsbildet selve logoen (f.eks. forsiden)? Da gir panel-visning
  // dobbel logo — bruk det rene merkekortet i stedet.
  if (img && knownLogoPaths.includes(new URL(img).pathname)) {
    img = undefined;
  }

  // Hent bildene selv og legg dem inn som data-URL-er (se fetchImageAsDataUrl).
  // Feiler en henting rendres kortet uten det bildet i stedet for å 500-e.
  const [imgData, logoData] = await Promise.all([
    img ? fetchImageAsDataUrl(img) : Promise.resolve(null),
    logo ? fetchImageAsDataUrl(absoluteUrl(logo.url)) : Promise.resolve(null),
  ]);
  img = imgData ?? undefined;
  const brandLogo = logo && logoData ? { ...logo, url: logoData } : null;

  // Foto i full bredde kun for cover-egnede bilder; contain (logoer m.m.)
  // bruker alltid panel så hele bildet vises.
  const layout = !img
    ? "plain"
    : fit === "cover" && style === "overlay"
      ? "overlay"
      : "panel";

  const fontSize =
    layout === "plain"
      ? title.length > 70
        ? 52
        : title.length > 40
          ? 62
          : 76
      : title.length > 70
        ? 42
        : title.length > 40
          ? 50
          : 58;

  let card: ReactElement;

  if (layout === "overlay" && img) {
    card = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          padding: "56px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={img}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            objectFit: "cover",
          }}
        />
        {/* Mørk gradient nederst så tekst og CTA alltid er lesbare */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 1200,
            height: 460,
            backgroundImage:
              "linear-gradient(to top, rgba(0,32,20,0.92) 0%, rgba(0,32,20,0.55) 55%, rgba(0,32,20,0) 100%)",
          }}
        />
        <div style={{ display: "flex" }}>
          <Brand logo={brandLogo} onDark />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#f2fafa",
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          <Cta text={ctaText} onDark />
        </div>
      </div>
    );
  } else if (img) {
    card = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f2fafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* Venstre: logo, tittel, CTA */}
        <div
          style={{
            width: 640,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 56px 64px 72px",
          }}
        >
          <Brand logo={brandLogo} onDark={false} />
          <div
            style={{
              display: "flex",
              fontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#004029",
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          <Cta text={ctaText} onDark={false} />
        </div>
        {/* Høyre: bildet — contain viser hele (logoer m.m.), cover for foto */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: fit === "contain" ? "#ffffff" : "#f2fafa",
            padding: fit === "contain" ? 48 : 0,
            borderLeft: "2px solid #d7e1de",
          }}
        >
          <img
            src={img}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: fit }}
          />
        </div>
      </div>
    );
  } else {
    card = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f2fafa",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Dekor: myke sirkler i sekundærpaletten */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: 9999,
            backgroundColor: "#abe3e3",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            right: 140,
            width: 300,
            height: 300,
            borderRadius: 9999,
            backgroundColor: "#ff99ad",
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 90,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: 9999,
            backgroundColor: "#eac435",
            opacity: 0.55,
          }}
        />
        <Brand logo={brandLogo} onDark={false} />
        <div
          style={{
            display: "flex",
            fontSize,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#004029",
            maxWidth: 900,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        <Cta text={ctaText} onDark={false} />
      </div>
    );
  }

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    headers: {
      // Kort nettleser-cache så endringer i Nettsted-innstillinger (logo/stil/
      // CTA) og admin-previewen plukker opp nye kort raskt; CDN får en time.
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
}

import config from "@payload-config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

/**
 * Globalene rammen rundt nettstedet trenger: header, bunntekst,
 * nettsted-innstillinger og samtykketekstene i kassen.
 *
 * Delt mellom (frontend)-layouten og universets egen layout, så de to rammene
 * ikke kan komme ut av synk — og så begge treffer den samme cachen.
 */
export async function getSiteGlobals() {
  "use cache";
  cacheTag("globals");
  cacheLife("max");

  const payload = await getPayload({ config });

  const [siteSettings, header, footer, shopSettings] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }).catch(() => null),
    payload.findGlobal({ slug: "header" }).catch(() => null),
    payload.findGlobal({ slug: "footer" }).catch(() => null),
    // Samtykketekstene i kassen (handlekurv, kurv-skuff, produktside).
    payload
      .findGlobal({ slug: "shop-settings", depth: 0 })
      .catch(() => null),
  ]);

  return { siteSettings, header, footer, shopSettings };
}

/**
 * Rammen rundt «Verdifull vekst-universet» (toppen + broa nederst). Egen
 * henter, ikke en del av `getSiteGlobals`, så resten av nettstedet slipper å
 * spørre etter noe det ikke bruker.
 */
export async function getUniverseGlobal() {
  "use cache";
  cacheTag("globals");
  cacheLife("max");

  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "universe" }).catch(() => null);
}

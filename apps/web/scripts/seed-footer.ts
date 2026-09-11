/**
 * Seeder bunnteksten (footer-globalen) med kolonner tilsvarende poynt.no.
 * Idempotent: overskriver footer-globalen hver gang. Juster fritt i admin etterpå.
 *
 * Lenkene bruker linkType "external" med relative URL-er (f.eks. "/personvern"),
 * slik at de fungerer både for CMS-sider og hardkodede ruter (/produkter, /kontakt).
 * Kjør seed-personvern + seed-kjopsbetingelser først så de juridiske sidene finnes.
 *
 *   bun run --cwd apps/web payload run scripts/seed-footer.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const link = (label: string, url: string) => ({
  label,
  linkType: "external" as const,
  url,
});

const columns = [
  {
    title: "Tilbud",
    links: [
      link("On Poynt", "/on-poynt"),
      link("Produkter & kurs", "/produkter"),
      link("Tjenester", "/tjenester"),
      link("Verktøy", "/verktoy"),
    ],
  },
  {
    title: "Selskap",
    links: [
      link("Om Poynt", "/om"),
      link("Kontakt", "/kontakt"),
      link("Kundehistorier", "/kundehistorier"),
      link("Blogg", "/blogg"),
      link("Podkast", "/podkast"),
    ],
  },
  {
    title: "Juridisk",
    links: [
      link("Kjøpsbetingelser", "/kjopsbetingelser"),
      link("Personvernerklæring", "/personvern"),
    ],
  },
];

const payload = await getPayload({ config });

// biome-ignore lint/suspicious/noExplicitAny: seed-data matcher footer-skjemaet
const data: any = {
  columns,
  // Selgeropplysninger (org.nr., adresse, e-post) hentes fra Nettbutikk-globalen
  // og vises som tabell i footeren — bunnteksten er kun copyright.
  bottomText: richText("© Poynt AS. Alle rettigheter reservert."),
  showSocialLinks: true,
  showNewsletter: false,
};

await payload.updateGlobal({ slug: "footer", data });

payload.logger.info("Ferdig med å seede bunnteksten (footer).");
process.exit(0);

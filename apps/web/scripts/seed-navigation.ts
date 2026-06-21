/**
 * Seeder hovedmenyen (header-globalen) med Variant B — målgruppe-først:
 * For gründere / For bedrifter / Ressurser / Om. Idempotent: overskriver
 * header-globalen hver gang. Juster fritt i admin etterpå.
 *
 *   bun run --cwd apps/web payload run scripts/seed-navigation.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const navItems = [
  {
    label: "For gründere",
    linkType: "custom" as const,
    url: "/for-grundere",
    subItems: [
      {
        label: "On Poynt",
        description: "Medlemskap med AI-verktøy",
        linkType: "custom" as const,
        url: "/on-poynt",
      },
      {
        label: "Verktøy",
        description: "Smarte verktøy for selvstendige",
        linkType: "custom" as const,
        url: "/verktoy",
      },
      {
        label: "Produkter & kurs",
        description: "Kurs, maler og digitale produkter",
        linkType: "custom" as const,
        url: "/produkter",
      },
    ],
  },
  {
    label: "For bedrifter",
    linkType: "custom" as const,
    url: "/for-bedrifter",
    subItems: [
      {
        label: "Styre & rådgivning",
        description: "Styreverv og strategisk rådgivning",
        linkType: "custom" as const,
        url: "/for-bedrifter#styre",
      },
      {
        label: "Foredrag",
        description: "Foredrag og workshops",
        linkType: "custom" as const,
        url: "/for-bedrifter#foredrag",
      },
      {
        label: "Ta kontakt",
        description: "Ta en uforpliktende prat",
        linkType: "custom" as const,
        url: "/kontakt",
      },
    ],
  },
  {
    label: "Ressurser",
    linkType: "custom" as const,
    url: "/blogg",
    subItems: [
      {
        label: "Blogg",
        description: "Tips og innsikt",
        linkType: "custom" as const,
        url: "/blogg",
      },
      {
        label: "Podkast",
        description: "Lytt til episodene",
        linkType: "custom" as const,
        url: "/podkast",
      },
      {
        label: "Artikler",
        description: "Lengre dypdykk",
        linkType: "custom" as const,
        url: "/artiklar",
      },
    ],
  },
  {
    label: "Om",
    linkType: "custom" as const,
    url: "/om",
  },
];

const payload = await getPayload({ config });

// biome-ignore lint/suspicious/noExplicitAny: seed-data matcher header-skjemaet
const data: any = {
  showSearch: true,
  showLogin: true,
  ctaButton: { show: true, text: "Ta kontakt", url: "/kontakt" },
  navItems,
};

await payload.updateGlobal({ slug: "header", data });

payload.logger.info("Ferdig med å seede navigasjon (Variant B).");
process.exit(0);

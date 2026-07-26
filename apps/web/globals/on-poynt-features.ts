import { revalidateTag } from "next/cache";
import type { Field, GlobalConfig } from "payload";
import type { FeatureKey } from "../lib/features/keys";

/**
 * Feature-flagg for On Poynt-medlemsområdet. Hver bryter styrer både
 * menypunktet i sidebaren og selve siden (server-side vakt) — skrus en
 * funksjon av, er den borte for sluttbrukerne med én gang.
 */
function featureField(
  name: FeatureKey,
  label: string,
  description: string
): Field {
  return {
    name,
    type: "checkbox",
    label,
    defaultValue: true,
    admin: { description },
  };
}

export const OnPoyntFeatures: GlobalConfig = {
  slug: "on-poynt-features",
  label: "On Poynt-funksjoner",
  admin: {
    // Ligger i den egenbygde «On Poynt»-nav-gruppen (on-poynt-nav-group.tsx),
    // ikke i Payloads standard-nav.
    group: false,
    description:
      "Skru funksjoner i medlemsområdet av og på. Avskrudde funksjoner forsvinner fra menyen, og sidene blir utilgjengelige for medlemmene.",
  },
  hooks: {
    afterChange: [
      () => {
        // Revalider cachen så endringen slår gjennom umiddelbart.
        try {
          revalidateTag("features", "max");
        } catch {
          // Utenfor Next-kontekst (f.eks. seed-script) — cachen utløper selv.
        }
      },
    ],
  },
  fields: [
    {
      type: "collapsible",
      label: "Verktøy",
      fields: [
        featureField(
          "kanalveileder",
          "Kanalveileder",
          "Finn de beste markedsføringskanalene."
        ),
        featureField(
          "markedsplan",
          "Markedsplan",
          "Generer en komplett markedsplan."
        ),
        featureField("arshjul", "Årshjul", "Planlegg innholdet gjennom året."),
      ],
    },
    {
      type: "collapsible",
      label: "Verktøykassa",
      fields: [
        featureField(
          "siNeiMedStil",
          "Si nei med stil",
          "Høflige avslag på forespørsler."
        ),
        featureField(
          "svarPaHenvendelser",
          "Svar på henvendelser",
          "Ferdige svar på anmeldelser og kundehenvendelser."
        ),
        featureField(
          "podcastTilInnhold",
          "Podcast til innhold",
          "Gjør podkast-episoder om til blogginnlegg og sosiale poster."
        ),
      ],
    },
    {
      type: "collapsible",
      label: "Øvrige områder",
      fields: [
        featureField(
          "fellesskap",
          "Fellesskap",
          "Medlemschatten — kanaler, grupper og meldinger."
        ),
        featureField(
          "laering",
          "Læring",
          "Guider og kurs (hele Læring-huben)."
        ),
        featureField(
          "minBedrift",
          "Min bedrift",
          "Bedriftsprofil og merkevare."
        ),
        featureField(
          "minStrategi",
          "Min strategi",
          "Strategi-oversikten (merkevare-boka)."
        ),
        featureField(
          "tilbakemelding",
          "Tilbakemelding",
          "Skjemaet for tilbakemeldinger og ønsker."
        ),
      ],
    },
  ],
};

import {
  type LexicalEditorProps,
  LinkFeature,
  validateUrl,
} from "@payloadcms/richtext-lexical";
import type {
  CollectionSlug,
  Field,
  FieldAffectingData,
  TextFieldSingleValidation,
} from "payload";
import { emailHref, lexicalLinkHref, phoneHref } from "./link-fields";

/**
 * Collections redaktøren kan lenke til med «Side på nettstedet». Samme liste
 * som `getPublicPath` kjenner — alt annet (media, ordrer, brukere …) har
 * ingen offentlig adresse og skal ikke dukke opp i velgeren.
 */
export const LINKABLE_COLLECTIONS = [
  "pages",
  "blog-posts",
  "case-studies",
  "services",
  "products",
  "guides",
  "courses",
] as const satisfies readonly CollectionSlug[];

const isType = (siblingData: Record<string, unknown>, ...types: string[]) =>
  types.includes(String(siblingData?.linkType ?? "custom"));

/** Nettadressen kreves bare for lenketypen «Nettadresse». */
const validateLinkUrl: TextFieldSingleValidation = (value, { siblingData }) => {
  if (!isType(siblingData, "custom")) return true;
  const url = typeof value === "string" ? value.trim() : "";
  if (!url || url === "https://") return "Skriv inn en nettadresse.";
  if (url.includes(" ")) return "Nettadressen kan ikke inneholde mellomrom.";
  return true;
};

const validateLinkPhone: TextFieldSingleValidation = (
  value,
  { siblingData }
) => {
  if (!isType(siblingData, "phone")) return true;
  const phone = typeof value === "string" ? value.trim() : "";
  if (!phone) return "Skriv inn et telefonnummer.";
  if (!/^\+?[\d\s().-]{5,}$/.test(phone)) {
    return "Telefonnummeret kan bare inneholde tall, mellomrom, + og bindestrek.";
  }
  return true;
};

/**
 * Lenke-feltene i Lexical («Sett inn lenke»). Bygger på Payloads standard-
 * felt, men:
 *
 * - Lenketype får «Forsiden» (forsiden er en global, ikke en side, og kan
 *   derfor ikke velges via «Side på nettstedet»), «E-postadresse» og
 *   «Telefonnummer».
 * - Nettadresse-feltet vises bare for «Nettadresse». For de andre typene
 *   fylles `url` inn automatisk ved lagring (`/`, `mailto:`, `tel:`), så
 *   lenkeforhåndsvisningen i editoren, HTML-/markdown-eksport og eldre kode
 *   som bare leser `url` fortsatt fungerer.
 * - Frontend (`components/rich-text/`) leser `linkType` + `email`/`phone`
 *   direkte og rendrer ikon, ny fane for eksterne lenker og popover for
 *   e-post/telefon.
 */
function linkFields({
  defaultFields,
}: {
  defaultFields: FieldAffectingData[];
}): (Field | FieldAffectingData)[] {
  const fields: (Field | FieldAffectingData)[] = [];

  for (const field of defaultFields) {
    switch (field.name) {
      case "linkType":
        fields.push({
          name: "linkType",
          type: "radio",
          label: "Lenketype",
          required: true,
          defaultValue: "custom",
          admin: {
            description:
              "Lenker til andre nettsteder åpnes automatisk i ny fane og får et ekstern-ikon. E-post og telefon får en liten meny med «send/ring» og «kopier».",
          },
          options: [
            { label: "Nettadresse", value: "custom" },
            { label: "Side på nettstedet", value: "internal" },
            { label: "Forsiden", value: "home" },
            { label: "E-postadresse", value: "email" },
            { label: "Telefonnummer", value: "phone" },
          ],
        });
        break;

      case "url":
        fields.push({
          name: "url",
          type: "text",
          label: "Nettadresse",
          admin: {
            condition: (_data, siblingData) => isType(siblingData, "custom"),
            placeholder: "https://",
          },
          hooks: {
            beforeChange: [
              ({ value, siblingData }) => {
                switch (siblingData?.linkType) {
                  case "home":
                    return "/";
                  case "email":
                    return siblingData.email
                      ? emailHref(String(siblingData.email))
                      : undefined;
                  case "phone":
                    return siblingData.phone
                      ? phoneHref(String(siblingData.phone))
                      : undefined;
                  case "internal":
                    return undefined;
                  default: {
                    if (!value) return value;
                    const url = String(value).trim();
                    // Samme oppførsel som Payloads standardfelt: ugyldige
                    // adresser kodes så de ikke kan brukes til noe farlig.
                    return validateUrl(url) ? url : encodeURIComponent(url);
                  }
                }
              },
            ],
          },
          validate: validateLinkUrl,
        });
        // E-post og telefon legges rett etter URL-feltet så rekkefølgen i
        // skuffen blir: tekst, lenketype, (nettadresse | side | e-post |
        // telefon), ny fane.
        fields.push({
          name: "email",
          type: "email",
          label: "E-postadresse",
          required: true,
          admin: {
            condition: (_data, siblingData) => isType(siblingData, "email"),
            placeholder: "hei@poynt.no",
          },
        });
        fields.push({
          name: "phone",
          type: "text",
          label: "Telefonnummer",
          required: true,
          admin: {
            condition: (_data, siblingData) => isType(siblingData, "phone"),
            placeholder: "+47 123 45 678",
            description:
              "Skriv nummeret slik det skal vises. Landkode (+47) gjør at det virker fra utlandet.",
          },
          validate: validateLinkPhone,
        });
        break;

      case "doc":
        fields.push({
          ...field,
          label: "Velg side",
          admin: {
            ...field.admin,
            condition: (_data, siblingData) => isType(siblingData, "internal"),
          },
        } as FieldAffectingData);
        break;

      case "newTab":
        fields.push({
          name: "newTab",
          type: "checkbox",
          label: "Åpne i ny fane",
          admin: {
            condition: (_data, siblingData) =>
              isType(siblingData, "custom", "internal", "home"),
            description:
              "Lenker til andre nettsteder åpnes alltid i ny fane. Slå på her om også en lenke til eget nettsted skal gjøre det.",
          },
        });
        break;

      default:
        fields.push(field);
    }
  }

  return fields;
}

export const PoyntLinkFeature = LinkFeature({
  enabledCollections: [...LINKABLE_COLLECTIONS],
  fields: linkFields,
  // Brukes av markdown-konverteren (bl.a. MCP-serveren) så interne lenker
  // får en ekte adresse i stedet for tom `[tekst]()`.
  internalDocToHref: ({ linkNode }) => lexicalLinkHref(linkNode.fields) ?? "",
});

/**
 * Payloads standardfunksjoner med vår lenkefunksjon i stedet for den
 * innebygde. Bruk i alle `lexicalEditor({ features })`, så alle richText-felt
 * får samme lenketyper.
 */
type FeaturesCallback = Extract<
  NonNullable<LexicalEditorProps["features"]>,
  (args: never) => unknown
>;
type ServerFeatures = Parameters<FeaturesCallback>[0]["defaultFeatures"];

export function withPoyntLinks(
  defaultFeatures: ServerFeatures
): ServerFeatures {
  return [
    ...defaultFeatures.filter((feature) => feature.key !== "link"),
    PoyntLinkFeature,
  ];
}

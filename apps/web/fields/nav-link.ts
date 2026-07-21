import type { Field } from "payload";

/**
 * Felles lenkefelter for navigasjonen (hovedmeny + undermeny), tidligere
 * duplisert inline i `globals/header.ts`. Feltnavnene er uendret, så dette er
 * kun en kosmetisk opprydding — ingen migrasjon nødvendig.
 */
export function navLinkFields(): Field[] {
  return [
    {
      name: "linkType",
      type: "select",
      defaultValue: "custom",
      options: [
        { label: "Egendefinert URL", value: "custom" },
        { label: "CMS-side", value: "page" },
        { label: "Blogginnlegg", value: "blog" },
        { label: "Produkt", value: "product" },
      ],
      label: "Lenketype",
    },
    {
      name: "url",
      type: "text",
      label: "URL",
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === "custom",
        description: "F.eks. /blogg, /produkter, eller https://ekstern-side.no",
      },
    },
    {
      name: "page",
      type: "relationship",
      relationTo: "pages",
      label: "Velg side",
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === "page",
      },
    },
    {
      name: "blogPost",
      type: "relationship",
      relationTo: "blog-posts",
      label: "Velg blogginnlegg",
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === "blog",
      },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      label: "Velg produkt",
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === "product",
      },
    },
    {
      name: "openInNewTab",
      type: "checkbox",
      label: "Åpne i ny fane",
      defaultValue: false,
    },
  ];
}

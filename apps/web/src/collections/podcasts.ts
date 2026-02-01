import type { CollectionConfig } from "payload";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Podcasts: CollectionConfig = {
  slug: "podcasts",
  labels: {
    singular: "Podkast-episode",
    plural: "Podkast-episoder",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "updatedAt"],
    group: "Innhold",
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Episodetittel",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "URL-slug",
      admin: {
        position: "sidebar",
        description: "Genereres automatisk fra tittel",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Kort beskrivelse",
      admin: {
        description: "Vises i oversikten og brukes til SEO",
      },
    },
    {
      name: "content",
      type: "richText",
      label: "Utvidet beskrivelse",
      admin: {
        description: "Valgfritt - vises på episode-siden",
      },
    },
    {
      name: "spotifyUrl",
      type: "text",
      required: true,
      label: "Spotify-lenke",
      admin: {
        description:
          "Full Spotify-URL til episoden (f.eks. https://open.spotify.com/episode/...)",
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: "Cover-bilde",
      admin: {
        description: "Episodebilde - vises i oversikten",
      },
    },
    {
      name: "guests",
      type: "array",
      label: "Gjester",
      admin: {
        description: "Valgfritt - legg til gjester i episoden",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Navn",
        },
        {
          name: "title",
          type: "text",
          label: "Tittel/rolle",
        },
      ],
    },
    {
      name: "duration",
      type: "text",
      label: "Varighet",
      admin: {
        position: "sidebar",
        description: "F.eks. '45 min'",
      },
    },
    {
      name: "episodeNumber",
      type: "number",
      label: "Episodenummer",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      label: "Publiseringsdato",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
        },
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Kategorier",
      admin: {
        position: "sidebar",
      },
    },
  ],
};

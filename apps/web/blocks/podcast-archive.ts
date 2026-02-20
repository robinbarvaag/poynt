import type { Block } from "payload";

export const PodcastArchive: Block = {
  slug: "podcastArchive",
  interfaceName: "PodcastArchiveBlock",
  labels: {
    singular: "Podcast-seksjon",
    plural: "Podcast-seksjoner",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "description",
      type: "textarea",
      label: "Beskrivelse",
    },
    {
      name: "limit",
      type: "number",
      label: "Antall episoder",
      defaultValue: 6,
      admin: {
        description: "Maks antall episoder som vises (0 = vis alle)",
      },
    },
    {
      name: "showMoreLink",
      type: "checkbox",
      label: "Vis 'Se alle'-lenke",
      defaultValue: true,
    },
  ],
};

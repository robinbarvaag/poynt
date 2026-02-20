import type { Block } from "payload";

export const SpotifyEmbed: Block = {
  slug: "spotify-embed",
  interfaceName: "SpotifyEmbedBlock",
  labels: {
    singular: "Spotify innbygging",
    plural: "Spotify innbygginger",
  },
  fields: [
    {
      name: "embedType",
      type: "select",
      required: true,
      defaultValue: "episode",
      label: "Type",
      options: [
        { label: "Episode", value: "episode" },
        { label: "Show (hel podkast)", value: "show" },
        { label: "Spilleliste", value: "playlist" },
      ],
    },
    {
      name: "spotifyUrl",
      type: "text",
      required: true,
      label: "Spotify URL",
      admin: {
        description:
          "Lim inn lenke fra Spotify (f.eks. https://open.spotify.com/episode/...)",
      },
    },
    {
      name: "title",
      type: "text",
      label: "Tittel (valgfritt)",
      admin: {
        description: "Overskrift som vises over spilleren",
      },
    },
    {
      name: "height",
      type: "select",
      defaultValue: "compact",
      label: "Størrelse",
      options: [
        { label: "Kompakt (152px)", value: "compact" },
        { label: "Standard (352px)", value: "standard" },
        { label: "Stor (500px)", value: "large" },
      ],
    },
    {
      name: "theme",
      type: "select",
      defaultValue: "auto",
      label: "Tema",
      options: [
        { label: "Automatisk", value: "auto" },
        { label: "Lyst", value: "light" },
        { label: "Mørkt", value: "dark" },
      ],
    },
  ],
};

import {
  BookmarkCard,
  Callout,
  ColumnsLayout,
  DownloadCard,
  Gallery,
  GuideToggle,
  ImagePlaceholder,
  VideoEmbed,
  VideoPlayer,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

// Samle-story for de mindre guide-innholdsblokkene.
const meta = {
  title: "Blokker/Guide/Innholdsblokker",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const demoText = (
  <>
    <p>
      Karuseller med flere bilder og musikk får ofte god rekkevidde. Last opp to
      eller flere bilder og velg musikk som passer budskapet.
    </p>
    <ul>
      <li>Test ut nye formater jevnlig</li>
      <li>Bruk søkbar alt-tekst</li>
    </ul>
  </>
);

export const Callouts: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <Callout tone="mint" icon="💡">
        <p>Tips: karuseller med musikk presterer godt akkurat nå.</p>
      </Callout>
      <Callout tone="saffron" icon="⭐">
        <p>Husk å variere innholdstypene dine gjennom uka.</p>
      </Callout>
      <Callout tone="ink" icon="🔑">
        <p>Krisekommunikasjon: vær raskt ute, vær ærlig, ta ansvar.</p>
      </Callout>
    </div>
  ),
};

export const Kolonner: Story = {
  render: () => (
    <div className="max-w-3xl">
      <ColumnsLayout
        columns={[
          <div key="t" className="prose">
            {demoText}
          </div>,
          <ImagePlaceholder key="i" label="Skjermbilde fra appen" />,
        ]}
      />
    </div>
  ),
};

export const Galleri: Story = {
  render: () => (
    <div className="max-w-3xl">
      <Gallery
        items={[
          { node: <ImagePlaceholder fill label="Bilde 1" /> },
          { node: <ImagePlaceholder fill label="Bilde 2" /> },
          { node: <ImagePlaceholder fill label="Bilde 3" /> },
        ]}
        caption="Eksempler på delbart innhold"
      />
    </div>
  ),
};

export const Bokmerker: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <BookmarkCard
        url="https://public.work/"
        title="public.work"
        description="Tidenes mest episke nettsted for frie bilder."
      />
      <BookmarkCard
        title="TopAi-Tools"
        description="Samler mange smarte AI-verktøy (ingen lenke ennå)."
      />
    </div>
  ),
};

export const Nedlastinger: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <DownloadCard
        title="75 innholdsideer til Instagram"
        description="PDF · 2,4 MB"
        kind="pdf"
        href="#"
      />
      <DownloadCard
        title="Innholdsplanlegger"
        description="Canva-mal"
        kind="canva"
        href="#"
      />
    </div>
  ),
};

export const Toggles: Story = {
  render: () => (
    <div className="max-w-2xl">
      <GuideToggle
        items={[
          {
            title: "LinkedIn-annonser",
            content: <p>Slik kommer du i gang med annonsering på LinkedIn.</p>,
          },
          { title: "Video på LinkedIn" },
        ]}
      />
    </div>
  ),
};

export const Video: Story = {
  render: () => (
    <div className="max-w-2xl">
      <VideoEmbed
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        caption="Eksempel-video"
      />
    </div>
  ),
};

// Selv-hostet (opplastet) video med våre egne kontroller — én med kontroller,
// én som stille auto-loop (uten kontroller).
const sampleVideo =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const OpplastetVideo: Story = {
  render: () => (
    <div className="max-w-2xl">
      <VideoPlayer src={sampleVideo} caption="Opplastet video med kontroller" />
    </div>
  ),
};

export const AutoLoopVideo: Story = {
  render: () => (
    <div className="max-w-2xl">
      <VideoPlayer src={sampleVideo} autoPlay muted loop controls={false} />
    </div>
  ),
};

export const Bildeplassholder: Story = {
  render: () => (
    <div className="max-w-md">
      <ImagePlaceholder label="Telefon-skjermbilde av Instagram-bio" />
    </div>
  ),
};

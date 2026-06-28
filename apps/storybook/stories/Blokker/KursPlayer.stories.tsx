import {
  Callout,
  DeviceFrame,
  DownloadCard,
  Heading,
  Icon,
  ImagePlaceholder,
  type LessonItem,
  LessonList,
  ReadingMeta,
  StepBlock,
  StepPager,
  VideoEmbed,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * Forslag til kurs-opplevelse. Fleksibel: noen leksjoner er bare opptak eller en
 * PDF fra et kurs som ble holdt, andre er steg-for-steg med bilder og delsteg.
 * Samme ramme – ulikt innhold per leksjon.
 */
const meta = {
  title: "Blokker/Guide/Kurs (player)",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LESSONS: LessonItem[] = [
  { id: "intro", title: "Velkommen til kurset", type: "video", meta: "3 min" },
  {
    id: "konto",
    title: "Sett opp Canva-kontoen",
    type: "steg",
    meta: "4 steg",
  },
  { id: "maler", title: "Malene du får av oss", type: "pdf", meta: "PDF" },
  {
    id: "karusell",
    title: "Lag din første karusell",
    type: "steg",
    meta: "5 steg",
  },
  {
    id: "opptak",
    title: "Opptak: live-workshop",
    type: "video",
    meta: "38 min",
  },
];

function CoursePlayer() {
  const [activeId, setActiveId] = useState("konto");
  const [done, setDone] = useState<Set<string>>(new Set(["intro"]));

  const items = LESSONS.map((l) => ({ ...l, completed: done.has(l.id) }));
  const index = LESSONS.findIndex((l) => l.id === activeId);
  const lesson = LESSONS[index];
  const isDone = done.has(activeId);

  const toggleComplete = () =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(activeId)) {
        next.delete(activeId);
      } else {
        next.add(activeId);
      }
      return next;
    });

  const go = (delta: number) => {
    const t = LESSONS[index + delta];
    if (t) setActiveId(t.id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-10 flex flex-col gap-3">
          <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            Kurs
          </span>
          <Heading variant="h1">Kom i gang med Canva</Heading>
          <ReadingMeta
            items={[
              { icon: "graduation-cap", label: "5 leksjoner" },
              { icon: "clock", label: "ca. 1 time" },
              { icon: "bar-chart", label: "Nybegynner" },
            ]}
          />
        </header>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          <aside className="mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-10">
              <LessonList
                items={items}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </div>
          </aside>

          <article className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Leksjon {index + 1} av {LESSONS.length}
              </span>
              <Heading variant="h2">{lesson.title}</Heading>
            </div>

            {/* Innholdet varierer med leksjonstypen */}
            {activeId === "intro" && (
              <VideoEmbed
                url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                caption="En kjapp intro til hva du lærer i dette kurset."
              />
            )}

            {activeId === "konto" && (
              <div className="flex flex-col gap-2">
                <StepBlock
                  number={1}
                  title="Opprett en gratis konto"
                  substeps={[
                    "Gå til canva.com og trykk «Registrer deg».",
                    "Bruk samme e-post som du bruker til jobb.",
                  ]}
                >
                  <p>
                    Du trenger ikke Pro for å komme i gang – gratisversjonen
                    holder lenge.
                  </p>
                </StepBlock>
                <StepBlock
                  number={2}
                  title="Sett opp merkevaren din"
                  substeps={[
                    "Last opp logoen din under «Merkevare».",
                    "Legg inn de to–tre fargene dine.",
                  ]}
                >
                  <DeviceFrame
                    variant="browser"
                    url="canva.com/brand"
                    caption="Merkevare-feltet ligger i venstremenyen."
                  >
                    <ImagePlaceholder
                      fill
                      label="Skjermbilde: Merkevare-oppsett i Canva"
                    />
                  </DeviceFrame>
                </StepBlock>
                <StepBlock number={3} title="Installer mobil-appen">
                  <p>
                    Da kan du lage innhold rett fra telefonen når ideen slår
                    ned.
                  </p>
                  <Callout tone="saffron" icon="💡">
                    Logg inn med samme konto, så er alt synkronisert.
                  </Callout>
                </StepBlock>
              </div>
            )}

            {activeId === "maler" && (
              <div className="flex flex-col gap-4">
                <p className="text-foreground/80 text-lg leading-relaxed">
                  Her er malene vi har laget til medlemmene. Last ned, åpne i
                  Canva, og bytt ut tekst og bilder.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DownloadCard
                    title="Karusell-mal (Instagram)"
                    description="10 sider, klar til å fylles ut"
                    kind="pdf"
                    href="#"
                  />
                  <DownloadCard
                    title="Story-maler"
                    description="5 varianter for tilbud og nyheter"
                    kind="pdf"
                    href="#"
                  />
                </div>
              </div>
            )}

            {activeId === "karusell" && (
              <div className="flex flex-col gap-2">
                <StepBlock
                  number={1}
                  title="Velg et karusell-format"
                  substeps={["Søk «Instagram-karusell» i malene."]}
                >
                  <DeviceFrame variant="phone">
                    <ImagePlaceholder fill label="Skjermbilde: Velg mal" />
                  </DeviceFrame>
                </StepBlock>
                <StepBlock
                  number={2}
                  title="Bygg den første siden godt"
                  substeps={[
                    "Sett en tydelig overskrift.",
                    "Bruk merkevarefargene dine.",
                  ]}
                >
                  <p>
                    Den første siden avgjør om folk blar videre – bruk litt tid
                    her.
                  </p>
                </StepBlock>
              </div>
            )}

            {activeId === "opptak" && (
              <div className="flex flex-col gap-4">
                <VideoEmbed
                  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  caption="Opptak fra workshopen vi holdt i mai."
                />
                <Callout tone="mint" icon="🎧">
                  Har du dårlig tid? Hopp til 12:30 – der starter den praktiske
                  delen.
                </Callout>
              </div>
            )}

            <StepPager
              prev={
                index > 0
                  ? { label: "Forrige", onClick: () => go(-1) }
                  : undefined
              }
              next={
                index < LESSONS.length - 1
                  ? { label: "Neste leksjon", onClick: () => go(1) }
                  : undefined
              }
              completed={isDone}
              onToggleComplete={toggleComplete}
            />
          </article>
        </div>
      </div>
    </div>
  );
}

export const Player: Story = {
  render: () => <CoursePlayer />,
};

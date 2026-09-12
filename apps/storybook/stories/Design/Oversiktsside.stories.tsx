import {
  BlockSection,
  BookHero,
  Button,
  ChapterRotator,
  FeatureGrid,
  Heading,
  HubLayout,
  PromptLibrary,
  ResourceGrid,
  Steps,
  Text,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Oversiktsside",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "«Oversiktsside med sidemeny» (Sidetype på Sider): heroen i full bredde, " +
          "resten i én kolonne med en sticky meny til venstre på desktop og en " +
          "sticky topplinje med nedtrekk på mobil. Menypunktene er blokkenes " +
          "«Blokk-navn» — samme tekst blir #ankeret på seksjonen. Laget for " +
          "ressurssider (QR-kode-sider) med mye innhold som ikke ligger i menyen.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const nav = [
  { id: "ki-tips", label: "KI-tips", icon: "sparkles" as const },
  { id: "prompter", label: "Prompter", icon: "bot" as const },
  { id: "arbeidsflyter", label: "Arbeidsflyter", icon: "layers" as const },
  { id: "boker", label: "Bøker", icon: "book" as const },
  { id: "filer", label: "Filer", icon: "download" as const },
];

const Section = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => (
  <div id={id} className="scroll-mt-28">
    <BlockSection
      background="default"
      spacing="md"
      containerSize={false}
      reveal={false}
    >
      {children}
    </BlockSection>
  </div>
);

export const Ressursside: Story = {
  render: () => (
    <div>
      <BookHero
        badge="Oppdatert september 2026"
        eyebrow="Fra Susanne"
        title="Verktøykassa mi"
        subtitle="Prompter, arbeidsflyter, bøker og filer jeg bruker selv. Alt på ett sted – kom tilbake når du trenger det."
        note="Siden ligger ikke i menyen – lagre adressen."
        figure={
          <ChapterRotator
            eyebrow="På denne siden"
            markers="numbers"
            aspect="card"
            chapters={nav.map((n) => ({
              title: n.label,
              href: `#${n.id}`,
              text: "Hopp rett til seksjonen.",
            }))}
          />
        }
        actions={
          <Button size="lg" className="rounded-full" type="button">
            Hopp til prompter
          </Button>
        }
      />

      <HubLayout
        nav={nav}
        aside={
          <div className="rounded-2xl bg-accent-1/40 p-4">
            <Text variant="small" customStyles="font-semibold text-foreground">
              Savner du noe?
            </Text>
            <Text variant="small" customStyles="mt-1 text-muted-foreground">
              Send meg en melding, så legger jeg det til.
            </Text>
          </div>
        }
      >
        <Section id="ki-tips">
          <FeatureGrid
            eyebrow="KI-tips"
            title="Små grep som gjør KI nyttig"
            columns={2}
            features={[
              {
                title: "Gi den en rolle*",
                text: "«Du er min regnskapsfører» gir bedre svar enn «hjelp meg med regnskap».",
              },
              {
                title: "Lim inn eksempler",
                text: "Vis hvordan du skriver, så treffer den tonen din i stedet for sin egen.",
              },
              {
                title: "Be om tre varianter",
                text: "Første svar er sjelden best. Tre forslag gir deg noe å velge mellom.",
              },
              {
                title: "Spør hva den trenger",
                text: "«Hvilke spørsmål må du ha svar på for å gjøre dette bra?» sparer en runde.",
              },
            ]}
          />
        </Section>

        <Section id="prompter">
          <PromptLibrary
            eyebrow="Prompter"
            title="Kopier og bruk"
            columns={2}
            prompts={[
              {
                title: "Ukas innhold",
                tool: "ChatGPT",
                prompt:
                  "Du er innholdsrådgiver for [bedriftsnavn]. Lag tre korte innlegg om [poeng] med ulik vinkel. Norsk, nøkternt, maks 80 ord hver.",
              },
              {
                title: "Oppsummer et møte",
                tool: "Claude",
                prompt:
                  "Oppsummer notatene i beslutninger, oppgaver (ansvarlig + frist) og åpne spørsmål.\n\n[notater]",
              },
            ]}
          />
        </Section>

        <Section id="arbeidsflyter">
          <Steps
            eyebrow="Arbeidsflyter"
            title="Søndagsplanen"
            steps={[
              {
                title: "Tøm hodet",
                text: "Alt som ligger og surrer, ned på papir. Ti minutter.",
              },
              {
                title: "Velg tre",
                text: "Tre ting som faktisk flytter bedriften denne uka.",
              },
              {
                title: "Blokker tid",
                text: "Legg dem i kalenderen før møtene tar plassen.",
              },
            ]}
          />
        </Section>

        <Section id="boker">
          <ResourceGrid
            eyebrow="Bøker"
            title="Bøkene jeg anbefaler oftest"
            columns={3}
            filter={false}
            items={[
              {
                title: "Deep Work",
                kind: "book",
                note: "Cal Newport",
                href: "https://example.com",
                image: (
                  <img src="https://picsum.photos/seed/b1/400/600" alt="" />
                ),
              },
              {
                title: "Company of One",
                kind: "book",
                note: "Paul Jarvis",
                href: "https://example.com",
                image: (
                  <img src="https://picsum.photos/seed/b2/400/600" alt="" />
                ),
              },
              {
                title: "Atomic Habits",
                kind: "book",
                note: "James Clear",
                href: "https://example.com",
                image: (
                  <img src="https://picsum.photos/seed/b3/400/600" alt="" />
                ),
              },
            ]}
          />
        </Section>

        <Section id="filer">
          <ResourceGrid
            eyebrow="Filer"
            title="Maler og sjekklister"
            layout="list"
            items={[
              {
                title: "Ukesplan-mal",
                kind: "file",
                href: "#",
                download: true,
                note: "PDF",
              },
              {
                title: "Sjekkliste før lansering",
                kind: "file",
                href: "#",
                download: true,
                note: "PDF",
              },
              {
                title: "Innholdskalender",
                kind: "file",
                href: "#",
                download: true,
                note: "Regneark",
              },
            ]}
          />
          <div className="mt-10">
            <Heading variant="h3">Det var alt – for nå.</Heading>
            <Text variant="muted" customStyles="mt-2">
              Siden oppdateres når jeg finner noe nytt som er verdt å dele.
            </Text>
          </div>
        </Section>
      </HubLayout>
    </div>
  ),
};

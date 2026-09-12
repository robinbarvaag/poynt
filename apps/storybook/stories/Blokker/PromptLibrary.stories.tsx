import { PromptLibrary, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof PromptLibrary> = {
  title: "Blokker/PromptLibrary",
  component: PromptLibrary,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Prompt-bibliotek: prompter som kopieres med ett trykk. Lange prompter " +
          "foldes sammen så lista forblir skannbar. Kopier-knappen er den ene " +
          "handlingen på kortet.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PromptLibrary>;

export const ToKolonner: Story = {
  name: "To kolonner",
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <PromptLibrary {...args} />
      </div>
    </Section>
  ),
  args: {
    eyebrow: "Prompter",
    title: "Prompter jeg bruker hver uke",
    intro:
      "Kopier, lim inn, bytt ut det i [klammer]. Skriv gjerne på norsk – verktøyene forstår det fint.",
    prompts: [
      {
        title: "Ukas innhold på 10 minutter",
        tool: "ChatGPT",
        tags: ["innhold", "sosiale medier"],
        description:
          "Når du vet hva du vil si, men ikke orker å skrive fem varianter.",
        prompt:
          "Du er innholdsrådgiver for [bedriftsnavn], som selger [hva] til [hvem].\n\nJeg vil dele dette poenget denne uka: [poenget].\n\nLag tre korte innlegg til LinkedIn/Instagram med ulik vinkel: ett personlig, ett praktisk (3 tips) og ett som stiller et spørsmål. Norsk, nøkternt, ingen emojier, maks 80 ord hver.",
      },
      {
        title: "Svar på en vanskelig e-post",
        tool: "Claude",
        tags: ["e-post"],
        description: "Når du må si nei, men vil beholde relasjonen.",
        prompt:
          "Her er en e-post jeg har fått: [lim inn].\n\nSkriv et svar der jeg takker nei til [hva], men holder døra åpen. Vennlig, kort, uten unnskyldninger. Foreslå ett alternativ.",
      },
      {
        title: "Kundeintervju-guide",
        tool: "Alle KI-verktøy",
        tags: ["kunder"],
        description: "Før du ringer en kunde for å forstå hvorfor de kjøpte.",
        prompt:
          "Jeg driver [bedrift] og skal intervjue en kunde som kjøpte [produkt/tjeneste] for [tid] siden.\n\nLag en intervjuguide med 8 åpne spørsmål i denne rekkefølgen:\n1. Situasjonen før de fant oss\n2. Hva som fikk dem til å lete\n3. Hvilke alternativer de vurderte\n4. Hva som avgjorde valget\n5. Hva som overrasket dem etterpå\n6. Hva de ville sagt til en venn\n\nUnngå ja/nei-spørsmål. Legg til et oppfølgingsspørsmål per hovedspørsmål. Avslutt med hva jeg bør lytte etter i svarene.",
      },
      {
        title: "Oppsummer et møte",
        tool: "Copilot",
        description: "Lim inn notatene dine, få en ryddig oppsummering.",
        prompt:
          "Oppsummer disse møtenotatene i tre deler: beslutninger, oppgaver (med ansvarlig og frist) og åpne spørsmål. Norsk, punktlister.\n\n[notater]",
      },
    ],
  },
};

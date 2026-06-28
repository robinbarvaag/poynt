import {
  Callout,
  DeviceFrame,
  GuideHero,
  Heading,
  Icon,
  ImagePlaceholder,
  PullQuote,
  ReadingMeta,
  ReadingNav,
  ReadingProgress,
  SectionRail,
  type SectionRailItem,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Forslag til ny lesemodus for det «myke» innholdet (guider/artikler/kurs).
 * Bruker bredden, en nummerert seksjons-stepper, skjermbilder i device-rammer
 * og redaksjonelle uthevinger — i stedet for en smal dokumentkolonne.
 */
const meta = {
  title: "Blokker/Guide/Lesemodus (redesign)",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SECTIONS: SectionRailItem[] = [
  { id: "karusell", label: "Skap liv i en karusell" },
  { id: "mockups", label: "Lag mockups på sekunder" },
  { id: "farger", label: "Bytt hele fargepaletten" },
  { id: "hurtigtaster", label: "Hurtigtaster som sparer tid" },
  { id: "magic", label: "Magic Eraser & Magic Grab" },
];

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-foreground/80 text-lg leading-relaxed">{children}</p>
  );
}

function SectionTitle({
  index,
  children,
}: { index: number; children: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-bold font-heading text-3xl text-primary/35 tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <Heading variant="h2">{children}</Heading>
    </div>
  );
}

const CANVA_SHOT =
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1400&q=70";

export const Lesemodus: Story = {
  render: () => (
    <div className="min-h-screen bg-background pb-24">
      <ReadingProgress className="hidden lg:block" />
      <ReadingNav items={SECTIONS} />

      <GuideHero
        title="Canva – tips & triks"
        eyebrow="Maler · Verktøy"
        lede="Småtriksene som gjør at du lager innhold som ser proft ut – uten å bruke en hel ettermiddag på det."
        icon="🎨"
        accent="mint"
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="-mt-6 relative z-10 mb-12">
          <ReadingMeta
            items={[
              { icon: "clock", label: "8 min" },
              { icon: "bar-chart", label: "Nybegynner" },
              { icon: "layers", label: "5 deler" },
              { icon: "refresh", label: "Oppdatert i juni" },
            ]}
          />
        </div>

        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-10">
              <SectionRail items={SECTIONS} />
            </div>
          </aside>

          <article className="flex min-w-0 flex-col gap-16">
            <section id="karusell" className="flex scroll-mt-24 flex-col gap-5">
              <SectionTitle index={1}>Skap liv i en karusell</SectionTitle>
              <Body>
                Karuseller er gull på Instagram og LinkedIn: de holder folk
                lenger, og algoritmen elsker det. Trikset er å bygge én mal og
                gjenbruke den – så slipper du å starte på null hver gang.
              </Body>
              <DeviceFrame
                variant="browser"
                url="canva.com/design"
                caption="Dupliser første side og bytt bare ut tekst og bilde for resten."
              >
                <img
                  src={CANVA_SHOT}
                  alt="Canva-arbeidsflate med en karusell"
                />
              </DeviceFrame>
              <Callout tone="saffron" icon="💡">
                Last ned karusellen som <strong>PNG (flere sider)</strong>, ikke
                PDF – da kan du laste den rett opp som en post.
              </Callout>
            </section>

            <PullQuote accent="salmon" cite="Tommelfingerregel for innhold">
              Bygg én mal du er glad i, og gjenbruk den til det kjedelige. Spar
              kreativiteten til budskapet.
            </PullQuote>

            <section id="mockups" className="flex scroll-mt-24 flex-col gap-5">
              <SectionTitle index={2}>Lag mockups på sekunder</SectionTitle>
              <Body>
                Skal du vise frem produktet ditt på en skjerm, en t-skjorte
                eller en kaffekopp? Søk «mockup» i appane-menyen, last opp
                designet ditt, og Canva legger det på automatisk.
              </Body>
              <DeviceFrame
                variant="phone"
                caption="På mobil ligger «Apper» bak plussknappen nederst."
              >
                <ImagePlaceholder
                  fill
                  label="Skjermbilde: Mockup-appen i Canva mobil"
                />
              </DeviceFrame>
            </section>

            <section id="farger" className="flex scroll-mt-24 flex-col gap-5">
              <SectionTitle index={3}>Bytt hele fargepaletten</SectionTitle>
              <Body>
                Fant du en mal du liker, men fargene passer ikke merkevaren din?
                Marker designet, åpne «Apply colors to page», og bytt hver farge
                til din egen palett på ett blunk.
              </Body>
              <DeviceFrame
                variant="browser"
                url="canva.com/design"
                caption="«Bilde kommer» ser bevisst ut når den står i en ramme."
              >
                <ImagePlaceholder
                  fill
                  label="Skjermbilde: «Apply colors to page» i Canva"
                />
              </DeviceFrame>
            </section>

            <section
              id="hurtigtaster"
              className="flex scroll-mt-24 flex-col gap-5"
            >
              <SectionTitle index={4}>Hurtigtaster som sparer tid</SectionTitle>
              <Body>
                Du trenger ikke mange – disse fire dekker det meste av det
                kjedelige:
              </Body>
              <ul className="flex flex-col gap-2.5">
                {[
                  ["T", "Legg til tekst"],
                  ["R", "Tegn et rektangel"],
                  ["⌘ / Ctrl + G", "Grupper det du har markert"],
                  ["⌘ / Ctrl + Shift + K", "Gjør tekst om til STORE bokstaver"],
                ].map(([key, what]) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-2xl bg-foreground/[0.03] px-4 py-3 ring-1 ring-foreground/10"
                  >
                    <kbd className="rounded-lg bg-background px-2.5 py-1 font-heading font-semibold text-foreground text-sm ring-1 ring-foreground/15">
                      {key}
                    </kbd>
                    <span className="text-foreground/80">{what}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="magic" className="flex scroll-mt-24 flex-col gap-5">
              <SectionTitle index={5}>Magic Eraser & Magic Grab</SectionTitle>
              <Body>
                To AI-funksjoner som føles som magi:{" "}
                <strong>Magic Eraser</strong> fjerner uønskede ting i bildet med
                en pensel, og <strong>Magic Grab</strong> løfter et motiv ut så
                du kan flytte det fritt.
              </Body>
              <Callout tone="mint" icon="✨">
                Begge ligger under «Rediger bilde» når du har markert et bilde.
                Krever Canva Pro – men sparer deg for en tur innom Photoshop.
              </Callout>
            </section>

            <footer className="mt-4 flex flex-col items-start gap-4 rounded-3xl bg-primary p-7 text-primary-foreground md:p-9">
              <Heading variant="h3" color="white">
                Ferdig med denne?
              </Heading>
              <p className="text-primary-foreground/85">
                Marker som lest, så foreslår vi neste guide i serien – «Lag en
                innholdskalender du faktisk klarer å følge».
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-background px-5 py-2.5 font-medium text-foreground"
                >
                  <Icon name="check" className="size-4" />
                  Marker som lest
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-2.5 font-medium text-primary-foreground ring-1 ring-white/25"
                >
                  Neste guide
                  <Icon name="arrow-right" className="size-4" />
                </button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  ),
};

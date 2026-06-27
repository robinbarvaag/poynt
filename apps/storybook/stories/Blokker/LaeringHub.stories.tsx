import {
  ContentCard,
  type ContentFormat,
  ContentFeature,
  ContentRail,
  Icon,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Forslag til samlet «Læring»-forside: ett redaksjonelt inngangspunkt for
 * guider, artikler, kurs og podkast – i stedet for tre separate kort-rutenett.
 */
const meta = {
  title: "Blokker/Guide/Læring (hub)",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const img = (src: string, alt: string) => (
  <img src={`${src}?w=900&q=70`} alt={alt} />
);

const FILTERS: { label: string; format?: ContentFormat; active?: boolean }[] = [
  { label: "Alt", active: true },
  { label: "Guider", format: "guide" },
  { label: "Artikler", format: "artikkel" },
  { label: "Kurs", format: "kurs" },
  { label: "Podkast", format: "podkast" },
];

export const Hub: Story = {
  render: () => (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:px-6 md:py-16">
        <header className="flex max-w-2xl flex-col gap-3">
          <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            Læring
          </span>
          <h1 className="text-balance font-bold font-heading text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Lær det du trenger, akkurat når du trenger det
          </h1>
          <p className="text-foreground/70 text-lg leading-relaxed">
            Korte guider, dypere kurs og artikler som inspirerer – plukket ut for
            små bedrifter som vil videre uten å drukne i teori.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={
                f.active
                  ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
                  : "inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-4 py-2 font-medium text-foreground/70 text-sm ring-1 ring-foreground/10 transition-colors hover:bg-foreground/[0.07]"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <ContentFeature
          href="#"
          format="guide"
          eyebrow="Redaksjonens valg"
          surface="mint"
          title="Lag en innholdskalender du faktisk klarer å følge"
          lede="En enkel rytme for å planlegge innhold en hel måned av gangen – uten at det tar over hele uka di."
          cover={img(
            "https://images.unsplash.com/photo-1506784983877-45594efa4cbe",
            "Kalender og planlegging"
          )}
          meta={[
            { icon: "clock", label: "12 min" },
            { icon: "bar-chart", label: "Nybegynner" },
          ]}
        />

        <ContentRail
          title="Kom i gang"
          description="Start her hvis du er ny – i rekkefølge."
          action={
            <a
              href="#"
              className="inline-flex items-center gap-1 font-medium text-primary text-sm"
            >
              Se alle <Icon name="arrow-right" className="size-4" />
            </a>
          }
        >
          <ContentCard
            href="#"
            format="guide"
            category="Grunnmur"
            title="Sett opp merkevaren din på 20 minutter"
            lede="Logo, farger og tone – det minste du trenger for å se proff ut."
            meta={[{ icon: "clock", label: "6 min" }]}
            cover={img(
              "https://images.unsplash.com/photo-1561070791-2526d30994b5",
              "Merkevare"
            )}
          />
          <ContentCard
            href="#"
            format="guide"
            category="Kanaler"
            title="Velg de kanalene som faktisk passer deg"
            lede="Du trenger ikke være overalt. Slik finner du dine to–tre."
            meta={[{ icon: "clock", label: "8 min" }]}
          />
          <ContentCard
            href="#"
            format="kurs"
            category="Innhold"
            title="Innholdsproduksjon for travle folk"
            lede="Fem korte leksjoner du kan ta i lunsjen."
            meta={[
              { icon: "graduation-cap", label: "5 leksjoner" },
              { icon: "clock", label: "45 min" },
            ]}
            cover={img(
              "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
              "Kurs"
            )}
          />
          <ContentCard
            href="#"
            format="artikkel"
            category="Tankegods"
            title="Hvorfor «bra nok og publisert» slår «perfekt og usendt»"
            meta={[{ icon: "clock", label: "4 min" }]}
          />
        </ContentRail>

        <ContentRail
          title="Mest populært nå"
          action={
            <a
              href="#"
              className="inline-flex items-center gap-1 font-medium text-primary text-sm"
            >
              Se alle <Icon name="arrow-right" className="size-4" />
            </a>
          }
        >
          <ContentCard
            href="#"
            format="guide"
            category="Maler"
            title="Canva – tips & triks"
            lede="Småtriksene som gjør at du lager innhold som ser proft ut."
            meta={[{ icon: "clock", label: "8 min" }]}
            cover={img(
              "https://images.unsplash.com/photo-1626785774573-4b799315345d",
              "Canva"
            )}
          />
          <ContentCard
            href="#"
            format="podkast"
            category="Avdelingsmøtet"
            title="Slik fikk Solstua 300 nye kunder på ett år"
            meta={[{ icon: "mic", label: "38 min" }]}
          />
          <ContentCard
            href="#"
            format="artikkel"
            category="SEO"
            title="Bli funnet på Google uten å være ekspert"
            lede="De fem grepene som faktisk flytter nåla for små bedrifter."
            meta={[{ icon: "clock", label: "7 min" }]}
            cover={img(
              "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07",
              "SEO"
            )}
          />
          <ContentCard
            href="#"
            format="kurs"
            category="Annonsering"
            title="Din første Facebook-annonse"
            meta={[{ icon: "graduation-cap", label: "4 leksjoner" }]}
          />
        </ContentRail>

        <section className="flex flex-col gap-5">
          <h2 className="font-bold font-heading text-2xl tracking-tight">
            Alt innhold
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ContentCard
              href="#"
              format="guide"
              category="Instagram"
              title="Reels som folk faktisk ser ferdig"
              lede="Struktur, lengde og de tre første sekundene."
              meta={[{ icon: "clock", label: "6 min" }]}
              cover={img(
                "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7",
                "Reels"
              )}
            />
            <ContentCard
              href="#"
              format="artikkel"
              category="E-post"
              title="Nyhetsbrev som ikke havner i søpla"
              lede="Emnefelt, rytme og det ene som avgjør om folk åpner."
              meta={[{ icon: "clock", label: "5 min" }]}
            />
            <ContentCard
              href="#"
              format="kurs"
              category="Merkevare"
              title="Finn din egen stemme"
              lede="Tre leksjoner om tone, ord og det som gjør deg til deg."
              meta={[{ icon: "graduation-cap", label: "3 leksjoner" }]}
              cover={img(
                "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
                "Stemme"
              )}
            />
            <ContentCard
              href="#"
              format="podkast"
              category="Avdelingsmøtet"
              title="Når bør du si nei til en kunde?"
              meta={[{ icon: "mic", label: "31 min" }]}
            />
            <ContentCard
              href="#"
              format="guide"
              category="LinkedIn"
              title="LinkedIn for deg som synes det er kleint"
              lede="Slik deler du fagstoff uten å føle deg som en selger."
              meta={[{ icon: "clock", label: "7 min" }]}
            />
            <ContentCard
              href="#"
              format="artikkel"
              category="Inspirasjon"
              title="Fem små bedrifter som gjør innhold riktig"
              lede="Konkrete eksempler du kan stjele med stolthet."
              meta={[{ icon: "clock", label: "9 min" }]}
              cover={img(
                "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
                "Inspirasjon"
              )}
            />
          </div>
        </section>
      </div>
    </div>
  ),
};

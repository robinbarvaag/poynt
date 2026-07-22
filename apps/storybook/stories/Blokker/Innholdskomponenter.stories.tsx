import {
  AuthorByline,
  ContentCard,
  ContentFilterBar,
  CourseHero,
  EmptyState,
  Icon,
  RelatedContent,
  ShareRow,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/** Lim-komponentene som binder innholds-flatene sammen. */
const meta = {
  title: "Blokker/Guide/Innholdskomponenter",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const img = (src: string) => <img src={`${src}?w=900&q=70`} alt="" />;

function Block({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
        {label}
      </span>
      {children}
    </section>
  );
}

export const Alle: Story = {
  render: () => {
    const [filter, setFilter] = useState("alt");
    const [channel, setChannel] = useState("facebook");
    const [category, setCategory] = useState("alle");
    const [query, setQuery] = useState("");
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-14 py-6">
        <Block label="CourseHero">
          <CourseHero
            title="Kom i gang med Canva"
            lede="Fra blank side til ferdig karusell på under en time."
            meta={[
              { icon: "graduation-cap", label: "5 leksjoner" },
              { icon: "clock", label: "ca. 1 time" },
            ]}
            learn={[
              "Sette opp merkevaren din i Canva",
              "Lage karuseller og maler du kan gjenbruke",
              "Bruke AI-funksjonene som sparer deg for tid",
            ]}
            cover={img(
              "https://images.unsplash.com/photo-1626785774573-4b799315345d"
            )}
          />
        </Block>

        <Block label="Filter (helhet: type + kanal)">
          <div className="flex flex-col gap-5 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex flex-col gap-2">
              <span className="px-0.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Type
              </span>
              <ContentFilterBar
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "alt", label: "Alt" },
                  { value: "guide", label: "Guider", icon: "compass" },
                  { value: "artikkel", label: "Artikler", icon: "newspaper" },
                  { value: "kurs", label: "Kurs", icon: "graduation-cap" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="px-0.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Kanal
              </span>
              <ContentFilterBar
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "alle", label: "Alle kanaler" },
                  { value: "instagram", label: "Instagram", dot: "#E1306C" },
                  { value: "linkedin", label: "LinkedIn", dot: "#0A66C2" },
                  { value: "facebook", label: "Facebook", dot: "#1877F2" },
                  { value: "youtube", label: "YouTube", dot: "#FF0000" },
                  { value: "canva", label: "Canva", dot: "#7D2AE8" },
                  { value: "keywords", label: "Keywords", dot: "#16a34a" },
                ]}
              />
            </div>
          </div>
        </Block>

        <Block label="Filter med søkefelt (bloggen)">
          <ContentFilterBar
            value={category}
            onChange={setCategory}
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Søk i innlegg …"
            options={[
              { value: "alle", label: "Alle innlegg" },
              { value: "markedsforing", label: "Markedsføring" },
              { value: "kommunikasjon", label: "Kommunikasjon" },
              { value: "tips", label: "Tips" },
            ]}
          />
        </Block>

        <Block label="AuthorByline">
          <div className="flex flex-wrap gap-8">
            <AuthorByline
              name="Kari Nordmann"
              role="Innholdsansvarlig"
              date="12. juni 2026"
            />
            <AuthorByline name="Ola Hansen" size="sm" date="3 min lesing" />
          </div>
        </Block>

        <Block label="ShareRow">
          <ShareRow
            actions={[
              { icon: "heart", label: "Lagre" },
              { icon: "copy", label: "Kopier lenke" },
              { icon: "share", label: "Del" },
            ]}
          />
        </Block>

        <Block label="EmptyState">
          <EmptyState
            icon="compass"
            title="Ingen treff her"
            description="Vi fant ingen guider som matcher filteret ditt. Prøv en annen kategori eller nullstill søket."
            action={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm"
              >
                <Icon name="refresh" className="size-4" />
                Nullstill filter
              </button>
            }
          />
        </Block>

        <Block label="RelatedContent">
          <RelatedContent title="Les videre">
            <ContentCard
              href="#"
              format="guide"
              category="Instagram"
              title="Reels som folk faktisk ser ferdig"
              meta={[{ icon: "clock", label: "6 min" }]}
            />
            <ContentCard
              href="#"
              format="artikkel"
              category="E-post"
              title="Nyhetsbrev som ikke havner i søpla"
              meta={[{ icon: "clock", label: "5 min" }]}
            />
            <ContentCard
              href="#"
              format="kurs"
              category="Merkevare"
              title="Finn din egen stemme"
              meta={[{ icon: "graduation-cap", label: "3 leksjoner" }]}
            />
          </RelatedContent>
        </Block>
      </div>
    );
  },
};

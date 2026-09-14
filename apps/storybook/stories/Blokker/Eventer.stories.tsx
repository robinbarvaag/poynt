import {
  ConfettiBurst,
  EventDateBadge,
  EventFacts,
  EventProgram,
  EventTicket,
  SpotsMeter,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta: Meta = {
  title: "Blokker/Eventer",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Byggeklossene til eventsidene: billett med QR-kode, plassmåler, program, faktakort, datomerke og konfetti ved påmelding. QR-koden genereres på serveren og sendes inn som SVG.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const SAMPLE_QR =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="#fff"/><path fill="#004029" d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zm1 1v5h5V1zm1 1h3v3h-3zM0 14h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM9 1h1v2H9zm2 1h2v1h-2zM8 4h2v2H8zm3 1h1v3h-1zM9 8h3v1H9zM0 9h2v1H0zm3 0h3v2H3zm11 0h2v1h-2zm3 0h4v1h-4zM8 10h1v3H8zm4 1h3v1h-3zm4 1h2v2h-2zm3 0h2v1h-2zM9 14h2v2H9zm3 1h1v3h-1zm2-1h3v1h-3zm-5 3h2v3H9zm6 0h2v2h-2zm3 1h3v1h-3zm-4 2h1v1h-1zm4 0h3v1h-3z"/></svg>';

const ticketBase = {
  eventTitle: "Lanseringsfest for «Verdifull vekst»",
  when: "torsdag 15. oktober 2026, kl. 18:00–21:00",
  where: "Eksempelstedet, Stavanger",
  name: "Kari Nordmann",
  code: "POY-7K3M",
  qrSvg: SAMPLE_QR,
};

export const Billett: Story = {
  render: () => <EventTicket {...ticketBase} status="registered" />,
};

export const BillettVenteliste: Story = {
  render: () => (
    <EventTicket {...ticketBase} status="waitlisted" waitlistPosition={3} />
  ),
};

export const BillettSjekketInn: Story = {
  render: () => <EventTicket {...ticketBase} status="checked_in" />,
};

function TearDemo() {
  const [checkedIn, setCheckedIn] = useState(false);
  return (
    <div className="space-y-6 pt-6">
      <EventTicket
        {...ticketBase}
        status={checkedIn ? "checked_in" : "registered"}
        celebrate={checkedIn}
      />
      <div className="text-center">
        <button
          type="button"
          onClick={() => setCheckedIn((value) => !value)}
          className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground"
        >
          {checkedIn ? "Tilbakestill" : "Skann billetten"}
        </button>
      </div>
    </div>
  );
}

/** Slik ser det ut når billettsiden står åpen i det personen skannes i døra. */
export const BillettRivesAv: Story = {
  render: () => <TearDemo />,
};

export const BillettAvmeldt: Story = {
  render: () => <EventTicket {...ticketBase} status="cancelled" />,
};

export const Plassmaler: Story = {
  render: () => (
    <div className="max-w-sm space-y-8">
      <SpotsMeter capacity={80} taken={23} />
      <SpotsMeter capacity={80} taken={74} />
      <SpotsMeter capacity={80} taken={80} waitlistEnabled />
      <SpotsMeter capacity={80} taken={80} />
    </div>
  ),
};

export const Program: Story = {
  render: () => (
    <div className="max-w-xl">
      <EventProgram
        items={[
          {
            time: "17:30",
            title: "Dørene åpner",
            description: "Noe å drikke og god tid til å finne en plass.",
          },
          { time: "18:00", title: "Velkommen" },
          {
            time: "18:15",
            title: "Historien bak boka",
            description: "Om å redde en bedrift jeg ikke ville ha.",
          },
          { time: "19:00", title: "Signering og mingling" },
        ]}
      />
    </div>
  ),
};

export const Faktakort: Story = {
  render: () => (
    <EventFacts
      className="lg:grid-cols-4"
      items={[
        { icon: "calendar", label: "Dato", value: "torsdag 15. oktober 2026" },
        { icon: "clock", label: "Tid", value: "18:00–21:00" },
        {
          icon: "map",
          label: "Sted",
          value: "Eksempelstedet, Stavanger",
          href: "#",
        },
        { icon: "ticket", label: "Pris", value: "Gratis" },
      ]}
    />
  ),
};

export const Datomerke: Story = {
  render: () => (
    <div className="flex gap-4">
      <EventDateBadge day="15" month="okt" />
      <EventDateBadge day="3" month="nov" tone="salmon" />
      <EventDateBadge day="21" month="jan" tone="mint" size="lg" />
    </div>
  ),
};

export const Konfetti: Story = {
  render: () => (
    <div className="relative mx-auto h-64 max-w-sm rounded-2xl bg-accent-3/30 pt-24 text-center">
      <ConfettiBurst />
      <p className="font-bold font-heading text-2xl">Du er påmeldt!</p>
    </div>
  ),
};

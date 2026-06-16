import { Newsletter } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Newsletter> = {
  title: "Blokker/Newsletter",
  component: Newsletter,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Nyhetsbrev-bånd. Selv-styrt seksjon. Standard-visningen er rein " +
          "presentasjon; i appen sendes et ekte skjema inn via `form`-slotten.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Newsletter>;

export const Primary: Story = {
  args: {
    eyebrow: "Nyhetsbrev",
    title: "Få det beste i innboksen",
    description:
      "Tips, nye kurs og verktøy — én rolig e-post i uka. Ingen spam, meld deg av når du vil.",
    variant: "primary",
  },
};

export const Saffron: Story = {
  args: {
    title: "Bli med på nyhetsbrevet",
    description: "Én e-post i uka med det viktigste.",
    variant: "saffron",
  },
};

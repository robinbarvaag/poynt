import { CartLineItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/CartLineItem",
  component: CartLineItem,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CartLineItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Bygg en nettside fra bunnen"
        priceLabel="kr 1 490"
        image={
          <img
            src="https://picsum.photos/seed/cartitem/120/120"
            alt=""
            className="size-full object-cover"
          />
        }
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const UtenBilde: Story = {
  name: "Uten bilde",
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Sjekkliste for lansering"
        priceLabel="kr 199"
        onRemove={() => {}}
      />
    </ul>
  ),
};

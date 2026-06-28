import { CartLineItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "Komponenter/CartLineItem",
  component: CartLineItem,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CartLineItem>;

export default meta;

type Story = StoryObj<typeof meta>;

const productImage = (
  <img
    src="https://picsum.photos/seed/cartitem/120/120"
    alt=""
    className="size-full object-cover"
  />
);

export const Default: Story = {
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Bygg en nettside fra bunnen"
        priceLabel="kr 1 490"
        quantity={1}
        image={productImage}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const MedVariant: Story = {
  name: "Med variant",
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Signert plakat – limited edition"
        variantLabel="Signert: Ja"
        priceLabel="kr 349"
        quantity={2}
        image={productImage}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const LangTittel: Story = {
  name: "Lang tittel",
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Tips for å lykkes med din neste digitale lansering på nett"
        priceLabel="kr 79"
        quantity={1}
        image={productImage}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const MaksAntallNadd: Story = {
  name: "Maks antall nådd",
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Sjekkliste for lansering"
        priceLabel="kr 199"
        quantity={5}
        incrementDisabled
        image={productImage}
        onIncrement={() => {}}
        onDecrement={() => {}}
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
        quantity={1}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const UtenStepper: Story = {
  name: "Uten stepper",
  render: () => (
    <ul className="w-[360px]">
      <CartLineItem
        name="Digitalt nedlastbart produkt"
        priceLabel="kr 199"
        image={productImage}
        onRemove={() => {}}
      />
    </ul>
  ),
};

export const Interaktiv: Story = {
  render: () => {
    const [quantity, setQuantity] = useState(1);
    return (
      <ul className="w-[360px]">
        <CartLineItem
          name="Bygg en nettside fra bunnen"
          priceLabel={`kr ${(1490 * quantity).toLocaleString("nb-NO")}`}
          quantity={quantity}
          image={productImage}
          incrementDisabled={quantity >= 5}
          onIncrement={() => setQuantity((q) => Math.min(5, q + 1))}
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          onRemove={() => {}}
        />
      </ul>
    );
  },
};

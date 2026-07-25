import { Button, CartDrawer, CartLineItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/120/120`}
    alt=""
    className="size-full object-cover"
  />
);

const meta = {
  title: "Komponenter/CartDrawer",
  component: CartDrawer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CartDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MedProdukter: Story = {
  name: "Med produkter",
  render: () => (
    <div className="min-h-[460px] bg-accent-3/30 p-8">
      <CartDrawer
        defaultOpen
        count={3}
        total="kr 4 179"
        onClear={() => {}}
        checkout={
          <Button className="w-full" size="lg" type="button">
            Gå til kassen
          </Button>
        }
        emptyAction={
          <Button variant="outline" type="button">
            Se produkter
          </Button>
        }
      >
        <CartLineItem
          name="Bygg en nettside fra bunnen"
          priceLabel="kr 1 490"
          quantity={1}
          image={img("c1")}
          onIncrement={() => {}}
          onDecrement={() => {}}
          onRemove={() => {}}
        />
        <CartLineItem
          name="Sjekkliste for lansering"
          priceLabel="kr 199"
          quantity={1}
          image={img("c2")}
          onIncrement={() => {}}
          onDecrement={() => {}}
          onRemove={() => {}}
        />
        <CartLineItem
          name="Alt-i-ett startpakke"
          priceLabel="kr 2 490"
          quantity={1}
          image={img("c3")}
          onIncrement={() => {}}
          onDecrement={() => {}}
          onRemove={() => {}}
        />
      </CartDrawer>
    </div>
  ),
};

export const Tom: Story = {
  render: () => (
    <div className="min-h-[460px] bg-accent-3/30 p-8">
      <CartDrawer
        defaultOpen
        count={0}
        total="kr 0"
        emptyAction={
          <Button variant="outline" type="button">
            Se produkter
          </Button>
        }
      />
    </div>
  ),
};

export const Trigger: Story = {
  name: "Trigger — tom vs «pop»",
  parameters: { layout: "centered" },
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <CartDrawer count={0} total="kr 0" />
        <span className="text-muted-foreground text-xs">Tom</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CartDrawer
          count={2}
          total="kr 1 689"
          checkout={
            <Button className="w-full" size="lg" type="button">
              Gå til kassen
            </Button>
          }
        >
          <CartLineItem
            name="Produkt"
            priceLabel="kr 1 490"
            onRemove={() => {}}
          />
        </CartDrawer>
        <span className="text-muted-foreground text-xs">Med varer (pop)</span>
      </div>
    </div>
  ),
};

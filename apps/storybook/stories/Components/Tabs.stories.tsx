import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const meta = {
  title: "Komponenter/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function Eksempel({
  variant,
  size,
}: {
  variant?: "default" | "line";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Tabs defaultValue="konto" className="w-[360px]">
      <TabsList variant={variant} size={size}>
        <TabsTrigger value="konto">Konto</TabsTrigger>
        <TabsTrigger value="varsler">Varsler</TabsTrigger>
      </TabsList>
      <TabsContent value="konto">
        Her kan du endre kontoinnstillingene dine og oppdatere profilen.
      </TabsContent>
      <TabsContent value="varsler">
        Velg hvilke varsler du vil motta på e-post og i appen.
      </TabsContent>
    </Tabs>
  );
}

export const Default: Story = {
  render: () => <Eksempel />,
};

export const Line: Story = {
  render: () => <Eksempel variant="line" />,
};

export const Størrelser: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Eksempel size="sm" />
      <Eksempel size="md" />
      <Eksempel size="lg" />
    </div>
  ),
};

// Klikk på en fane skal bytte aktivt panel.
export const ByttTest: Story = {
  name: "Test: bytt fane",
  render: () => <Eksempel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/endre kontoinnstillingene/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "Varsler" }));
    await expect(canvas.getByText(/hvilke varsler/i)).toBeVisible();
  },
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="konto" className="w-[360px]">
      <TabsList>
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
  ),
};

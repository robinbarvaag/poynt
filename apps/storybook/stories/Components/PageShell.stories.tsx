import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageShell,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/PageShell",
  component: PageShell,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

const Demo = () => (
  <>
    <PageHeader
      title="Eksempelside"
      description="Innholdet plasseres likt på tvers av medlemsområdets sider."
    />
    <Card>
      <CardHeader>
        <CardTitle>Et kort</CardTitle>
      </CardHeader>
      <CardContent>Innhold …</CardContent>
    </Card>
  </>
);

// Full bredde — standarden (samme som dashbordet).
export const Full: Story = {
  args: { children: <Demo /> },
};

// Smal kolonne — for skjema/innstillinger.
export const Narrow: Story = {
  name: "Smal",
  args: { width: "narrow", children: <Demo /> },
};

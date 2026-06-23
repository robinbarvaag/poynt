import { AiBadge } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/AiBadge",
  component: AiBadge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AiBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

// Én dempet, konsistent markør for AI-generert innhald. Erstatter det gamle
// sparkles-/emoji-rotet — samme uttrykk overalt.
export const Default: Story = {
  args: { label: "AI-generert" },
};

export const EgenTekst: Story = {
  name: "Egen tekst",
  args: { label: "AI-forslag" },
};

export const IKontekst: Story = {
  name: "I kontekst",
  render: () => (
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-semibold">Din markedsplan</h2>
      <AiBadge />
    </div>
  ),
};

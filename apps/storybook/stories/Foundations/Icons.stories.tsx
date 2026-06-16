import { Icon, iconNames } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Ikoner",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

export const AlleIkoner: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {iconNames.length} ikoner — basert på lucide-react. Bruk{" "}
        <code className="text-foreground">{'<Icon name="..." />'}</code>.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {iconNames.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <Icon name={name} className="size-6 text-primary" />
            <code className="text-center text-[10px] leading-tight text-muted-foreground">
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

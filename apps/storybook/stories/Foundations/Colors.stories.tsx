import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Farger",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

const TOKENS: { name: string; varName: string }[] = [
  { name: "background", varName: "--background" },
  { name: "foreground", varName: "--foreground" },
  { name: "primary", varName: "--primary" },
  { name: "primary-foreground", varName: "--primary-foreground" },
  { name: "secondary", varName: "--secondary" },
  { name: "secondary-foreground", varName: "--secondary-foreground" },
  { name: "accent", varName: "--accent" },
  { name: "accent-foreground", varName: "--accent-foreground" },
  { name: "muted", varName: "--muted" },
  { name: "muted-foreground", varName: "--muted-foreground" },
  { name: "card", varName: "--card" },
  { name: "card-foreground", varName: "--card-foreground" },
  { name: "destructive", varName: "--destructive" },
  { name: "destructive-foreground", varName: "--destructive-foreground" },
  { name: "border", varName: "--border" },
  { name: "input", varName: "--input" },
  { name: "ring", varName: "--ring" },
];

const CHARTS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
];

const SIDEBAR = [
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-accent",
  "--sidebar-border",
];

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 w-full rounded-lg border border-border shadow-sm"
        style={{ background: `var(${varName})` }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <code className="text-xs text-muted-foreground">{varName}</code>
      </div>
    </div>
  );
}

function Grid({
  title,
  items,
}: {
  title: string;
  items: { name: string; varName: string }[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {items.map((t) => (
          <Swatch key={t.varName} varName={t.varName} label={t.name} />
        ))}
      </div>
    </section>
  );
}

export const Palett: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Grid title="Kjernefarger" items={TOKENS} />
      <Grid
        title="Diagram"
        items={CHARTS.map((v) => ({ name: v.replace("--", ""), varName: v }))}
      />
      <Grid
        title="Sidebar"
        items={SIDEBAR.map((v) => ({ name: v.replace("--", ""), varName: v }))}
      />
    </div>
  ),
};

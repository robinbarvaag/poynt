import { BlogFilterBar } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const categories = [
  { value: "markedsforing", label: "Markedsføring" },
  { value: "kommunikasjon", label: "Kommunikasjon" },
  { value: "tips", label: "Tips" },
];

function Demo() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  return (
    <div className="w-full max-w-4xl space-y-6">
      <BlogFilterBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        query={query}
        onQueryChange={setQuery}
      />
      <p className="text-muted-foreground text-sm">
        Aktiv kategori: <code>{activeCategory ?? "alle"}</code> · Søk:{" "}
        <code>{query || "—"}</code>
      </p>
    </div>
  );
}

const meta = {
  title: "Blokker/BlogFilterBar",
  component: BlogFilterBar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof BlogFilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Demo />,
};

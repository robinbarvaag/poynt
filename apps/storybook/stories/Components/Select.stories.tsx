import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Nedtrekksliste for å velge ett alternativ fra mange. Brukes når det er for mange valg til radioknapper, og for å spare plass i skjemaer.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Velg en bransje" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="handel">Varehandel</SelectItem>
          <SelectItem value="bygg">Bygg og anlegg</SelectItem>
          <SelectItem value="helse">Helse og omsorg</SelectItem>
          <SelectItem value="teknologi">Teknologi</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

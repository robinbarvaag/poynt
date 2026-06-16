import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Liten boble med utfyllende informasjon som vises når brukeren holder musa over et element. Brukes for hint og forklaringer som ikke trenger fast plass.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hold over meg</Button>
        </TooltipTrigger>
        <TooltipContent>Her er litt ekstra informasjon.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

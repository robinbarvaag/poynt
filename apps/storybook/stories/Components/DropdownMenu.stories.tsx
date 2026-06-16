import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Meny med handlinger som åpnes fra en knapp. Brukes for kontekstvalg som profil, innstillinger og handlinger på en rad eller et element.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Meny</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Min konto</DropdownMenuLabel>
        <DropdownMenuItem>Profil</DropdownMenuItem>
        <DropdownMenuItem>Innstillinger</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logg ut</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

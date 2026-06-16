import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Modalt vindu som legger seg over siden og krever oppmerksomhet. Brukes for bekreftelser, skjemaer og viktige meldinger der brukeren må ta et valg.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Slett konto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Er du sikker?</DialogTitle>
          <DialogDescription>
            Denne handlingen kan ikke angres. Kontoen din og alle data blir
            slettet permanent.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive">Slett konto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

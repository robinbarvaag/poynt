import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Medlemskap</CardTitle>
        <CardDescription>Velg planen som passer deg</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Få full tilgang til alle kurs, verktøy og fellesskapet vårt. Du kan
          når som helst oppgradere eller avslutte medlemskapet.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Bli medlem</Button>
      </CardFooter>
    </Card>
  ),
};

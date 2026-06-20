import { Button, Checkbox } from "@poynt/ui";
import {
  Field,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  useForm,
  zodResolver,
} from "@poynt/ui/form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { z } from "zod";

const schema = z.object({
  navn: z.string().min(2, "Navnet må ha minst 2 tegn"),
  epost: z.email("Ugyldig e-postadresse"),
  melding: z.string().min(10, "Skriv minst 10 tegn"),
  samtykke: z.literal(true, { message: "Du må godta vilkårene" }),
});

type Values = z.infer<typeof schema>;

function KontaktForm() {
  const [sendt, setSendt] = useState<Values | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { navn: "", epost: "", melding: "", samtykke: false },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => setSendt(v))}
        className="w-[360px] space-y-6"
      >
        <Field
          control={form.control}
          name="navn"
          label="Navn"
          description="Dette er navnet som vises offentlig."
        >
          <Input placeholder="Skriv navnet ditt" />
        </Field>

        <Field control={form.control} name="epost" label="E-post">
          <Input type="email" placeholder="navn@eksempel.no" />
        </Field>

        <Field control={form.control} name="melding" label="Melding">
          <Textarea placeholder="Hva kan vi hjelpe deg med?" />
        </Field>

        <FormField
          control={form.control}
          name="samtykke"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2.5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Jeg godtar vilkårene</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Send inn</Button>

        {sendt && (
          <p className="text-sm text-primary" data-testid="suksess">
            Takk, {sendt.navn}! Meldingen er sendt.
          </p>
        )}
      </form>
    </Form>
  );
}

const meta = {
  title: "Komponenter/Form",
  component: Form,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Komplett skjema",
  render: () => <KontaktForm />,
};

// Tom innsending skal vise valideringsfeil for hvert felt.
export const ValideringTest: Story = {
  name: "Test: validering",
  render: () => <KontaktForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Send inn" }));
    await expect(
      await canvas.findByText("Navnet må ha minst 2 tegn")
    ).toBeVisible();
    await expect(canvas.getByText("Ugyldig e-postadresse")).toBeVisible();
    await expect(canvas.getByText("Du må godta vilkårene")).toBeVisible();
  },
};

// Et gyldig utfylt skjema skal sende inn og vise kvittering.
export const InnsendingTest: Story = {
  name: "Test: vellykket innsending",
  render: () => <KontaktForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Navn"), "Robin");
    await userEvent.type(canvas.getByLabelText("E-post"), "robin@poynt.no");
    await userEvent.type(
      canvas.getByLabelText("Melding"),
      "Jeg ønsker å vite mer om medlemskapet."
    );
    await userEvent.click(canvas.getByRole("checkbox"));
    await userEvent.click(canvas.getByRole("button", { name: "Send inn" }));
    await expect(await canvas.findByTestId("suksess")).toBeVisible();
  },
};

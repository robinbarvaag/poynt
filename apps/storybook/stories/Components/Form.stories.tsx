import { Button, Input } from "@poynt/ui";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@poynt/ui/form";
import type { Meta, StoryObj } from "@storybook/react-vite";

type FormValues = {
  navn: string;
};

function ProfilForm() {
  const form = useForm<FormValues>({
    defaultValues: { navn: "" },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {})}
        className="w-[320px] space-y-6"
      >
        <FormField
          control={form.control}
          name="navn"
          rules={{
            required: "Navn er påkrevd",
            minLength: { value: 2, message: "Navnet må ha minst 2 tegn" },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navn</FormLabel>
              <FormControl>
                <Input placeholder="Skriv navnet ditt" {...field} />
              </FormControl>
              <FormDescription>
                Dette er navnet som vises offentlig.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Lagre</Button>
      </form>
    </Form>
  );
}

const meta = {
  title: "Komponenter/Form",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Skjemabyggeklosser bygget på react-hook-form og zod. Brukes for å koble felter til validering med tilhørende ledetekst, hjelpetekst og feilmelding.",
      },
    },
  },
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ProfilForm />,
};

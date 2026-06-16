import { Container, Section, Stack } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tillatte avstander i systemet. `Section` har en `spacing`-prop for " +
          "vertikal seksjonsrytme (sm/md/lg/xl), og `Stack` gir fast avstand " +
          "mellom barn (xs–xl). Hold deg til disse for konsistent rytme — " +
          "unngå vilkårlige py-/gap-verdier.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const SECTION_PY: Record<string, string> = {
  sm: "py-12 → md:py-16",
  md: "py-16 → md:py-24",
  lg: "py-24 → md:py-32",
  xl: "py-32 → md:py-44",
};

export const SeksjonsRytme: Story = {
  name: "Section — spacing",
  render: () => (
    <div className="flex flex-col gap-8">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} className="flex flex-col gap-2">
          <code className="text-muted-foreground text-xs">
            {`<Section spacing="${s}" />`} — {SECTION_PY[s]}
          </code>
          <Section variant="muted" spacing={s} className="rounded-xl">
            <Container>
              <div className="rounded-lg bg-card py-3 text-center text-card-foreground text-sm shadow-sm">
                innhold
              </div>
            </Container>
          </Section>
        </div>
      ))}
    </div>
  ),
};

const STACK_GAP: Record<string, string> = {
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-10",
  xl: "gap-16",
};

export const StackAvstand: Story = {
  name: "Stack — gap",
  render: () => (
    <div className="flex flex-wrap gap-10">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <code className="text-muted-foreground text-xs">
            {`gap="${g}"`} ({STACK_GAP[g]})
          </code>
          <Stack gap={g}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-8 w-36 rounded-md bg-primary/15" />
            ))}
          </Stack>
        </div>
      ))}
    </div>
  ),
};

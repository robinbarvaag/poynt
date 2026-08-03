import {
  Button,
  Container,
  Countdown,
  Eyebrow,
  GridPattern,
  Heading,
  Panel,
  Text,
  cn,
} from "@poynt/ui";
import { Reveal } from "@poynt/ui/motion";
import Link from "next/link";

interface CountdownBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  targetDate: string;
  doneLabel?: string | null;
  cta?: { text?: string | null; url?: string | null } | null;
  variant?: "primary" | "saffron" | "salmon" | null;
}

// Samme tone-oppsett som Tall-båndet, så de fargede panelene på en side leser
// som én familie.
const themes = {
  primary: {
    surface: "primary",
    heading: "white",
    eyebrow: "text-primary-foreground/70",
    description: "text-primary-foreground/80",
    grid: "text-primary-foreground/20",
    button: "saffron",
    tone: "onPrimary",
  },
  saffron: {
    surface: "saffron",
    heading: "foreground",
    eyebrow: "text-foreground/60",
    description: "text-foreground/75",
    grid: "text-foreground/10",
    button: "ink",
    tone: "default",
  },
  salmon: {
    surface: "salmon",
    heading: "foreground",
    eyebrow: "text-foreground/60",
    description: "text-foreground/75",
    grid: "text-foreground/10",
    button: "ink",
    tone: "default",
  },
} as const;

/** Mapper Payload-blokken `countdown` til et nedtellings-panel. */
export function CountdownBlockComponent({
  eyebrow,
  title,
  description,
  targetDate,
  doneLabel,
  cta,
  variant,
}: CountdownBlockProps) {
  const theme = themes[variant ?? "primary"];

  return (
    <Container padding="none">
      <Reveal>
        <Panel surface={theme.surface}>
          <GridPattern variant="dots" fade className={theme.grid} />
          <div className="relative z-10 flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              {eyebrow && (
                <Eyebrow className={theme.eyebrow}>{eyebrow}</Eyebrow>
              )}
              {title && (
                <Heading variant="h2" color={theme.heading} customStyles="mt-3">
                  {title}
                </Heading>
              )}
              {description && (
                <Text customStyles={cn("mt-4 text-pretty", theme.description)}>
                  {description}
                </Text>
              )}
              {cta?.text && cta.url && (
                <div className="mt-7">
                  <Button asChild size="lg" variant={theme.button}>
                    <Link href={cta.url}>{cta.text}</Link>
                  </Button>
                </div>
              )}
            </div>

            <Countdown
              target={targetDate}
              tone={theme.tone}
              doneLabel={doneLabel ?? undefined}
            />
          </div>
        </Panel>
      </Reveal>
    </Container>
  );
}

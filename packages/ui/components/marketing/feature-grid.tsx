import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";

export interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

export interface FeatureGridProps {
  /** Liten etikett over tittelen. */
  eyebrow?: string;
  title?: string;
  intro?: string;
  features: Feature[];
  /** Antall kolonner på desktop. Default 3. */
  columns?: 2 | 3 | 4;
}

// Roterende tint på ikon-chipene — gir liv uten å bli rotete.
const chipTints = [
  "bg-primary/10 text-primary",
  "bg-saffron/40 text-foreground",
  "bg-mint/60 text-foreground",
  "bg-salmon/30 text-foreground",
] as const;

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * Verdi-/feature-rutenett («hvorfor Poynt»). Innholds-only — pakkes i
 * `BlockSection` i appen. Header er valgfri; kortene staggrer inn.
 */
export function FeatureGrid({
  eyebrow,
  title,
  intro,
  features,
  columns = 3,
}: FeatureGridProps) {
  return (
    <Container padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && (
              <Text
                variant="small"
                color="primary"
                customStyles="uppercase tracking-[0.18em]"
              >
                {eyebrow}
              </Text>
            )}
            {title && (
              <Heading variant="h2" color="foreground" customStyles="mt-3">
                {title}
              </Heading>
            )}
            {intro && (
              <Text variant="lead" customStyles="mt-4">
                {intro}
              </Text>
            )}
          </div>
        </Reveal>
      )}

      <Stagger className={cn("grid grid-cols-1 gap-5", columnClass[columns])}>
        {features.map((feature, index) => (
          <StaggerItem key={feature.title}>
            <div className="group h-full rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                  chipTints[index % chipTints.length]
                )}
              >
                <Icon name={feature.icon} className="size-6" />
              </span>
              <Heading variant="h4" color="foreground" customStyles="mt-5">
                {feature.title}
              </Heading>
              <Text customStyles="mt-2 text-muted-foreground">
                {feature.text}
              </Text>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  );
}

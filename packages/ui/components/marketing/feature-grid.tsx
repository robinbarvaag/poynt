import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";

export interface Feature {
  icon: IconName;
  /** Tittel. Bruk `*` for en aksent-stjerne, f.eks. "Lær raskere*". */
  title: string;
  text: string;
  /** Valgfri lenke nederst (PayPal-stil "Se mer →"). */
  link?: { label: string; href: string };
  /** Valgfritt nøkkeltall nederst i stedet for lenke. */
  stat?: { value: string; label: string };
}

export interface FeatureGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  features: Feature[];
  /** Antall kolonner på desktop. Default 3. */
  columns?: 2 | 3 | 4;
}

// Modige fargeblokker — hvert kort er en hel mettet flate (jf. INSPO/PayPal).
// `accent` er en kontrastfarge brukt på stjerne/lenke for å gi kortet snert.
const themes = [
  {
    surface: "bg-saffron text-foreground",
    rule: "border-foreground/15",
    muted: "text-foreground/70",
    accent: "text-salmon",
  },
  {
    surface: "bg-salmon text-foreground",
    rule: "border-foreground/15",
    muted: "text-foreground/75",
    accent: "text-primary",
  },
  {
    surface: "bg-primary text-primary-foreground",
    rule: "border-primary-foreground/25",
    muted: "text-primary-foreground/75",
    accent: "text-saffron",
  },
] as const;

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/** Deler tittel på siste `*` slik at stjernen kan farges som aksent. */
function splitTitle(title: string) {
  const star = title.includes("*");
  return { base: title.replace(/\*/g, ""), star };
}

/**
 * Verdi-/feature-rutenett i modig fargeblokk-stil (INSPO/PayPal): hver flate er
 * en mettet farge med stor line-art-ikon, fet editorial-tittel med aksent-
 * stjerne, tynn skillelinje og en lenke eller et nøkkeltall. Innholds-only.
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
          <div className="mb-12 max-w-2xl">
            {eyebrow && (
              <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.2em]">
                {eyebrow}
              </span>
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
        {features.map((feature, index) => {
          const theme = themes[index % themes.length];
          const { base, star } = splitTitle(feature.title);
          return (
            <StaggerItem key={feature.title}>
              <div
                className={cn(
                  "group flex h-full min-h-80 flex-col rounded-[1.75rem] p-8 transition-transform duration-300 hover:-translate-y-1.5",
                  theme.surface
                )}
              >
                <div className="flex items-start justify-between">
                  <Icon
                    name={feature.icon}
                    className="size-14"
                    strokeWidth={1.5}
                  />
                  <span className="font-heading font-bold text-sm tracking-[0.2em] opacity-40">
                    0{index + 1}
                  </span>
                </div>

                <div className="mt-auto pt-12">
                  <h3 className="font-heading font-bold text-3xl leading-[1.1]">
                    {base}
                    {star && <span className={theme.accent}>*</span>}
                  </h3>
                  <hr className={cn("my-5 border-t", theme.rule)} />
                  <p className={cn("text-sm leading-relaxed", theme.muted)}>
                    {feature.text}
                  </p>

                  {feature.link && (
                    <a
                      href={feature.link.href}
                      className={cn(
                        "mt-6 inline-flex items-center gap-1.5 font-semibold text-sm",
                        theme.accent
                      )}
                    >
                      {feature.link.label}
                      <Icon
                        name="arrow-right"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </a>
                  )}

                  {feature.stat && (
                    <div className="mt-6">
                      <div className="font-heading font-bold text-4xl leading-none">
                        {feature.stat.value}
                      </div>
                      <div className={cn("mt-1 text-sm", theme.muted)}>
                        {feature.stat.label}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Container>
  );
}

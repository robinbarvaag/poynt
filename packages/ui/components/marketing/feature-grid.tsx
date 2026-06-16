import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";

export interface Feature {
  /** Tittel. Bruk `*` for en aksent-stjerne, f.eks. "Lær raskere*". */
  title: string;
  text: string;
  /** Valgfri lenke nederst (marker-strek-stil). */
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
// Ingen ikoner: det store tallet er det grafiske ankeret. `accent` er en
// HØY-KONTRAST kontrastfarge (tall, stjerne, lenke) — aldri rosa-på-gult o.l.
const themes = [
  {
    surface: "bg-saffron text-foreground",
    rule: "border-foreground/15",
    muted: "text-foreground/70",
    accent: "text-primary",
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
 * en mettet farge med et stort tall som grafisk anker (ingen ikoner), fet
 * tittel med aksent-stjerne, skillelinje og en lenke eller et nøkkeltall.
 * Faste sone-høyder gjør at alle kort blir nøyaktig like høye. Innholds-only.
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
                  "flex h-full flex-col rounded-[1.75rem] p-8 transition-transform duration-300 hover:-translate-y-1.5",
                  theme.surface
                )}
              >
                {/* Tall — fast sone */}
                <span
                  className={cn(
                    "font-heading font-bold text-7xl leading-none tracking-tight",
                    theme.accent
                  )}
                >
                  0{index + 1}
                </span>

                {/* Tittel — alltid 2 rader avsatt */}
                <h3 className="mt-8 line-clamp-2 min-h-[4.2rem] font-heading font-bold text-3xl leading-[1.1]">
                  {base}
                  {star && <span className={theme.accent}>*</span>}
                </h3>

                <hr className={cn("my-5 border-t", theme.rule)} />

                {/* Beskrivelse — line-clamp 4, men følger teksten i høyde */}
                <p
                  className={cn(
                    "line-clamp-4 text-sm leading-relaxed",
                    theme.muted
                  )}
                >
                  {feature.text}
                </p>

                {/* Footer — kun når det er en lenke eller et tall; pinnet til bunn */}
                {feature.link && (
                  <a
                    href={feature.link.href}
                    className={cn(
                      "group/link mt-auto inline-flex w-fit flex-col gap-2 pt-8 font-bold text-sm",
                      theme.accent
                    )}
                  >
                    {feature.link.label}
                    <span
                      aria-hidden="true"
                      className="h-0.75 w-9 rounded-full bg-current transition-all duration-300 ease-out group-hover/link:w-full"
                    />
                  </a>
                )}
                {!feature.link && feature.stat && (
                  <div className="mt-auto pt-8">
                    <div className="font-heading font-bold text-4xl leading-none">
                      {feature.stat.value}
                    </div>
                    <div className={cn("mt-1 text-sm", theme.muted)}>
                      {feature.stat.label}
                    </div>
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Container>
  );
}

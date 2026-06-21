import { cn } from "../../lib/utils";
import { Card } from "../card";
import { Container, gridVariants } from "../container";
import { Eyebrow } from "../eyebrow";
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

// Modige fargeblokker — hvert kort er et `Card` med en mettet `surface`
// (jf. INSPO/PayPal). Ingen ikoner: det store tallet er det grafiske ankeret.
// `accent` er en HØY-KONTRAST kontrastfarge (tall, stjerne, lenke) — aldri
// rosa-på-gult o.l. — og `rule`/`muted` er surface-tilpassede innholdsfarger.
const themes = [
  {
    surface: "saffron",
    rule: "border-foreground/15",
    muted: "text-foreground/70",
    accent: "text-primary",
  },
  {
    surface: "salmon",
    rule: "border-foreground/15",
    muted: "text-foreground/75",
    accent: "text-primary",
  },
  {
    surface: "primary",
    rule: "border-primary-foreground/25",
    muted: "text-primary-foreground/75",
    accent: "text-saffron",
  },
] as const;

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
            {eyebrow && <Eyebrow className="text-primary">{eyebrow}</Eyebrow>}
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

      <Stagger className={cn(gridVariants({ cols: columns, gap: "md" }))}>
        {features.map((feature, index) => {
          const theme = themes[index % themes.length];
          const { base, star } = splitTitle(feature.title);
          const cardClassName = cn(
            "h-full gap-0 rounded-[1.75rem] p-8 transition-transform duration-300 hover:-translate-y-1.5",
            feature.link &&
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          );
          const cardBody = (
            <>
              {/* Tall — fast sone */}
                <Text
                  type="span"
                  size="display-xl"
                  weight="bold"
                  color="inherit"
                  customStyles={cn(
                    "font-heading leading-none tracking-tight",
                    theme.accent
                  )}
                >
                  0{index + 1}
                </Text>

                {/* Tittel — alltid 2 rader avsatt */}
                <Heading
                  variant="h3"
                  size="display-sm"
                  color="inherit"
                  weight="bold"
                  customStyles="mt-8 line-clamp-2 min-h-[4.2rem] leading-[1.1]"
                >
                  {base}
                  {star && <span className={theme.accent}>*</span>}
                </Heading>

                <hr className={cn("my-5 border-t", theme.rule)} />

                {/* Beskrivelse — line-clamp 4, men følger teksten i høyde */}
                <Text
                  color="inherit"
                  customStyles={cn("line-clamp-4 leading-relaxed", theme.muted)}
                >
                  {feature.text}
                </Text>

                {/* Footer — kun når det er en lenke eller et tall; pinnet til bunn.
                    Hele kortet er lenken (Card asChild + <a>), så dette er kun
                    et visuelt anker som animerer på hover over hele kortet. */}
                {feature.link && (
                  <span
                    className={cn(
                      "mt-auto inline-flex w-fit flex-col gap-2 pt-8 font-bold text-sm",
                      theme.accent
                    )}
                  >
                    {feature.link.label}
                    <span
                      aria-hidden="true"
                      className="h-0.75 w-9 rounded-full bg-current transition-all duration-300 ease-out group-hover/card:w-full"
                    />
                  </span>
                )}
                {!feature.link && feature.stat && (
                  <div className="mt-auto pt-8">
                    <Text
                      type="div"
                      size="display-md"
                      weight="bold"
                      color="inherit"
                      customStyles="font-heading leading-none"
                    >
                      {feature.stat.value}
                    </Text>
                    <Text
                      color="inherit"
                      customStyles={cn("mt-1", theme.muted)}
                    >
                      {feature.stat.label}
                    </Text>
                  </div>
                )}
            </>
          );
          return (
            <StaggerItem key={feature.title} className="h-full">
              {feature.link ? (
                <Card asChild surface={theme.surface} className={cardClassName}>
                  <a href={feature.link.href}>{cardBody}</a>
                </Card>
              ) : (
                <Card surface={theme.surface} className={cardClassName}>
                  {cardBody}
                </Card>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </Container>
  );
}

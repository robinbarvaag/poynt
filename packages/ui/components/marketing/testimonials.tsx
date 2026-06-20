import { cn } from "../../lib/utils";
import { Container, gridVariants } from "../container";
import { Eyebrow } from "../eyebrow";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";
import { TestimonialCard, type TestimonialCardProps } from "./testimonial-card";

export interface TestimonialItem extends TestimonialCardProps {
  id: string | number;
}

export interface TestimonialsProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /**
   * `cards` = rutenett av kort. `quote` = ett stort, sentrert sitat (bruker
   * den første anmeldelsen). Default `cards`.
   */
  layout?: "cards" | "quote";
  /** Antall kolonner på desktop i `cards`-layout. Default 3. */
  columns?: 2 | 3;
  testimonials: TestimonialItem[];
}

function SectionHeader({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  align?: "left" | "center";
}) {
  if (!eyebrow && !title && !intro) {
    return null;
  }
  return (
    <Reveal>
      <div
        className={cn(
          "mb-12 max-w-2xl",
          align === "center" && "mx-auto text-center"
        )}
      >
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
  );
}

/**
 * Anmeldelses-seksjon: enten et rutenett av `TestimonialCard` (`cards`) eller
 * ett stort, sentrert sitat (`quote`). Samme byggekloss som de andre
 * marketing-seksjonene (eyebrow + tittel + intro, deretter innholdet).
 * Presentasjons-only.
 */
export function Testimonials({
  eyebrow,
  title,
  intro,
  layout = "cards",
  columns = 3,
  testimonials,
}: TestimonialsProps) {
  if (!testimonials.length) {
    return null;
  }

  if (layout === "quote") {
    const featured = testimonials[0];
    return (
      <Container padding="none">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          intro={intro}
          align="center"
        />
        <Reveal>
          <figure className="mx-auto max-w-3xl text-center">
            {featured.logo ? (
              <div className="relative mx-auto mb-8 h-12 w-40">
                {featured.logo}
              </div>
            ) : (
              <span className="font-heading text-6xl text-primary/20 leading-none">
                &ldquo;
              </span>
            )}
            <blockquote className="mt-4 font-medium text-2xl leading-relaxed tracking-tight md:text-3xl">
              {featured.quote}
            </blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-3">
              {featured.avatar && (
                <span className="relative size-16 overflow-hidden rounded-full bg-current/10">
                  {featured.avatar}
                </span>
              )}
              <div>
                <div className="font-semibold text-lg">{featured.author}</div>
                {(featured.role || featured.company) && (
                  <div className="text-muted-foreground">
                    {featured.role}
                    {featured.role && featured.company && ", "}
                    {featured.company}
                  </div>
                )}
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    );
  }

  return (
    <Container padding="none">
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
      <Stagger className={cn(gridVariants({ cols: columns, gap: "md" }))}>
        {testimonials.map(({ id, ...testimonial }) => (
          <StaggerItem key={id} className="h-full">
            <TestimonialCard {...testimonial} />
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  );
}

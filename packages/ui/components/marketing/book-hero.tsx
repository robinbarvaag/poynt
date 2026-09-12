import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Container } from "../container";
import { FloatingShapes } from "../decorative";
import { Eyebrow } from "../eyebrow";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";

export interface BookHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Liten status-pille over tittelen, f.eks. «Kommer våren 2027». */
  badge?: string;
  /** Korte løfter om boka. Vises som en avhaket liste. */
  bullets?: string[];
  /**
   * Objektet til høyre: `<BookCover>` når omslaget finnes, ellers
   * `<ChapterRotator>`. Slotten er bevisst generisk — heroen eier plasseringen,
   * ikke hva som står der.
   */
  figure?: ReactNode;
  /** Hvilken side figuren står på (desktop). Default `right`. */
  figureSide?: "left" | "right";
  /** Påmeldingsskjemaet. Ligger rett i heroen: ett skjermbilde, én handling. */
  form?: ReactNode;
  /**
   * Knapper (typisk to `<Button asChild>`) når heroen ikke har skjema — en
   * ressursside vil heller sende leseren ned på siden enn be om e-post.
   */
  actions?: ReactNode;
  /** Liten tekst under skjemaet/knappene (personvern, hva som skjer videre). */
  note?: string;
  /** Fargeflekkene i bakgrunnen. Default `subtle`; `none` skrur dem av. */
  shapes?: "subtle" | "default" | "vibrant" | "none";
  className?: string;
}

/**
 * Heroen på en bok-/lanseringsside: løfte og påmelding til venstre, boka som
 * fysisk objekt til høyre. Fargeflekkene bak boka driver sakte, og omslaget
 * vipper mot pekeren — bevegelsen er dekorativ og sitter på det ene elementet
 * blikket allerede hviler på, ikke utover hele siden.
 *
 * Samme hero bærer også en ressurs-/oversiktsside: kapittelkortet blir da en
 * innholdsfortegnelse, og `actions` erstatter skjemaet.
 */
export function BookHero({
  eyebrow,
  title,
  subtitle,
  badge,
  bullets,
  figure,
  figureSide = "right",
  form,
  actions,
  note,
  shapes = "subtle",
  className,
}: BookHeroProps) {
  const figureLeft = figureSide === "left";

  return (
    <section
      className={cn("relative overflow-hidden py-16 md:py-24", className)}
    >
      {shapes !== "none" && <FloatingShapes variant={shapes} />}

      <Container padding="none" className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className={cn("lg:col-span-7", figureLeft && "lg:order-2")}>
            <Stagger>
              {badge && (
                <StaggerItem>
                  <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-1 px-4 py-1.5 font-medium text-foreground text-sm">
                    {/* Statisk prikk, ikke pulserende: boka bak svever allerede,
                        og to ting som blinker samtidig blir uro, ikke liv. */}
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                    {badge}
                  </span>
                </StaggerItem>
              )}

              {eyebrow && (
                <StaggerItem>
                  <Eyebrow>{eyebrow}</Eyebrow>
                </StaggerItem>
              )}

              <StaggerItem>
                <Heading variant="h1" customStyles="mt-3 text-balance">
                  {title}
                </Heading>
              </StaggerItem>

              {subtitle && (
                <StaggerItem>
                  <Text variant="lead" customStyles="mt-5 max-w-xl text-pretty">
                    {subtitle}
                  </Text>
                </StaggerItem>
              )}

              {bullets && bullets.length > 0 && (
                <StaggerItem>
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-bold text-primary text-xs"
                        >
                          ✓
                        </span>
                        {/* text-pretty hindrer at siste ord blir stående alene
                            på en linje – «… kjenner deg igjen / i» så stygt ut. */}
                        <Text
                          type="span"
                          variant="muted"
                          customStyles="text-pretty"
                        >
                          {bullet}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </StaggerItem>
              )}

              {form && (
                <StaggerItem>
                  <div className="mt-9 rounded-3xl bg-card p-6 shadow-lg ring-1 ring-border md:p-8">
                    {form}
                  </div>
                </StaggerItem>
              )}

              {!form && actions && (
                <StaggerItem>
                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    {actions}
                  </div>
                </StaggerItem>
              )}

              {note && (
                <StaggerItem>
                  <Text
                    variant="small"
                    customStyles="mt-4 text-muted-foreground"
                  >
                    {note}
                  </Text>
                </StaggerItem>
              )}
            </Stagger>
          </div>

          {figure && (
            <div className={cn("lg:col-span-5", figureLeft && "lg:order-1")}>
              <Reveal
                delay={0.1}
                className={cn(
                  "mx-auto w-full max-w-[19rem] md:max-w-sm",
                  figureLeft ? "lg:mr-auto lg:ml-0" : "lg:mr-0 lg:ml-auto"
                )}
              >
                {figure}
              </Reveal>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

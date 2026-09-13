import type { ComponentType, ReactNode } from "react";
import { Icon, type IconName } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { Badge } from "../badge";
import { Button } from "../button";
import { GridPattern } from "../decorative";
import { CountUp, Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";
import { HeroPortrait } from "./hero-portrait";

export interface HeroStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface HeroPill {
  label: string;
  icon?: IconName;
}

export interface HeroProps {
  /** Liten badge øverst (valgfri). */
  eyebrow?: string;
  /** Ikon i badgen (valgfri). */
  eyebrowIcon?: IconName;
  /** Tittel — ReactNode så caller kan fremheve et ord, f.eks. <span className="text-primary">. */
  title: ReactNode;
  /** Ingress — ReactNode (appen sender RichText, Storybook sender tekst). */
  subtitle?: ReactNode;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  /** Bilde-slot — klippes i en organisk form. Uten media blir heroen sentrert. */
  media?: ReactNode;
  /**
   * Legg et mykt merkefarge-filter (duotone) over bildet. Default `true` — fint
   * for illustrasjoner/grafikk. Slå av for ekte foto av personer, der fargen
   * over ville sett rart ut.
   */
  duotone?: boolean;
  /** Flytende pills oppå bildet (maks 3 vises). */
  pills?: HeroPill[];
  /** Nøkkeltall under CTA-ene — teller opp i viewport. */
  stats?: HeroStat[];
  className?: string;
  /**
   * Lenkekomponent for CTA-ene (typisk next/link, så f.eks. /kontakt fanges
   * av modal-interceptoren). Default er en vanlig <a> med full sidelast.
   */
  linkComponent?: ComponentType<{
    href: string;
    className?: string;
    children: ReactNode;
  }>;
}

/**
 * Forsidens hero (jf. docs/DESIGN-PLAN.md §2). Tekst til venstre, et ekte foto
 * klippet i en organisk form med duotone-effekt og flytende pills til høyre, og
 * en drivende blob + parallax-dekor bak. Uten `media` blir heroen sentrert.
 * Presentasjons-only — bilde og lenker sendes inn som slots/props. Eier sin egen
 * full-bredde `<section>` (plasseres direkte, ikke i BlockSection).
 */
export function Hero({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  media,
  duotone = true,
  pills,
  stats,
  className,
  linkComponent: LinkComp,
}: HeroProps) {
  const split = Boolean(media);

  return (
    <section
      className={cn("relative w-full overflow-hidden bg-secondary", className)}
    >
      {/* Subtil rutenett-tekstur — roligere og mer «laget» enn myke
          gradient-blobber. Toner ut mot kantene. */}
      <GridPattern
        variant="grid"
        size={40}
        fade
        className="text-foreground/6"
      />

      <div
        className={cn(
          "relative z-10 mx-auto grid items-center gap-12 px-6 pt-32 pb-16 sm:pb-24 lg:pt-40",
          split ? "max-w-6xl lg:grid-cols-2" : "max-w-3xl text-center"
        )}
      >
        {/* Budskap */}
        <Stagger
          className={cn(
            "flex flex-col gap-6",
            split ? "items-start" : "items-center"
          )}
        >
          {eyebrow && (
            <StaggerItem>
              <Badge
                variant="accent"
                size="lg"
                className="gap-1.5 rounded-full"
              >
                {eyebrowIcon && <Icon name={eyebrowIcon} className="size-4" />}
                {eyebrow}
              </Badge>
            </StaggerItem>
          )}
          <StaggerItem>
            <Heading
              variant="h1"
              color="foreground"
              customStyles={split ? "max-w-xl" : "max-w-3xl"}
            >
              {title}
            </Heading>
          </StaggerItem>
          {subtitle && (
            <StaggerItem>
              <Text
                type="div"
                variant="lead"
                customStyles={cn(
                  "text-foreground/70",
                  split ? "max-w-md" : "mx-auto max-w-xl"
                )}
              >
                {subtitle}
              </Text>
            </StaggerItem>
          )}
          {(primaryCta || secondaryCta) && (
            <StaggerItem>
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3",
                  !split && "justify-center"
                )}
              >
                {primaryCta && (
                  <Button asChild size="lg" className="rounded-full px-8">
                    {LinkComp ? (
                      <LinkComp href={primaryCta.href}>
                        {primaryCta.text}
                        <Icon name="arrow-right" className="ml-2 size-4" />
                      </LinkComp>
                    ) : (
                      <UILink href={primaryCta.href}>
                        {primaryCta.text}
                        <Icon name="arrow-right" className="ml-2 size-4" />
                      </UILink>
                    )}
                  </Button>
                )}
                {secondaryCta && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-primary/30 bg-transparent px-8 text-primary hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {LinkComp ? (
                      <LinkComp href={secondaryCta.href}>
                        {secondaryCta.text}
                      </LinkComp>
                    ) : (
                      <UILink href={secondaryCta.href}>
                        {secondaryCta.text}
                      </UILink>
                    )}
                  </Button>
                )}
              </div>
            </StaggerItem>
          )}
          {stats && stats.length > 0 && (
            <StaggerItem>
              <div className="mt-4 flex gap-10">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="font-bold font-heading text-3xl text-primary">
                      <CountUp
                        to={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </StaggerItem>
          )}
        </Stagger>

        {/* Foto klippet i organisk form, med duotone/brand-effekt. På mobil
            havner det under teksten, litt mindre og med innrykk til sidene så
            de flytende pillene ikke klippes av skjermkanten. */}
        {split && (
          <Reveal
            delay={0.2}
            className="relative mx-auto w-full max-w-[18rem] sm:max-w-sm lg:max-w-md"
          >
            <HeroPortrait duotone={duotone} pills={pills}>
              {media}
            </HeroPortrait>
          </Reveal>
        )}
      </div>
    </section>
  );
}

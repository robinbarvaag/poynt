import type { ReactNode } from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  CountUp,
  DriftingBlob,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "../motion";
import { Heading, Text } from "../typography";

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
}

const PILL_POSITIONS = [
  "-left-4 top-12",
  "top-1/3 right-0",
  "bottom-10 left-6",
];

function FloatingPill({
  className,
  icon,
  label,
}: {
  className: string;
  icon?: IconName;
  label: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-lg ring-1 ring-foreground/5",
        className
      )}
    >
      {icon && <Icon name={icon} className="size-4 text-primary" />}
      <span className="font-medium text-card-foreground text-sm">{label}</span>
    </div>
  );
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
}: HeroProps) {
  const split = Boolean(media);

  return (
    <section
      className={cn("relative w-full overflow-hidden bg-secondary", className)}
    >
      {/* Drivende, pustende dekor */}
      <DriftingBlob className="-left-24 top-4 size-96 bg-primary/25" />
      <Parallax amount={40} className="-right-16 absolute top-24 z-0">
        <div className="size-72 rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-accent/40 blur-2xl" />
      </Parallax>

      <div
        className={cn(
          "relative z-10 mx-auto grid items-center gap-12 px-6 pt-32 pb-24 lg:pt-40",
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
                    <a href={primaryCta.href}>
                      {primaryCta.text}
                      <Icon name="arrow-right" className="ml-2 size-4" />
                    </a>
                  </Button>
                )}
                {secondaryCta && (
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="rounded-full px-6"
                  >
                    <a href={secondaryCta.href}>{secondaryCta.text}</a>
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

        {/* Foto klippet i organisk form, med duotone/brand-effekt */}
        {split && (
          <Reveal
            delay={0.2}
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            {/* Myk, animert blob bak bildet — driver sakte rundt formen */}
            <div
              aria-hidden="true"
              className="-inset-5 absolute animate-blob rounded-[60%_40%_42%_58%/55%_45%_55%_45%] bg-accent/25 motion-reduce:animate-none"
            />
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-[60%_40%_42%_58%/55%_45%_55%_45%] shadow-xl ring-1 ring-foreground/10">
              {media}
              {duotone && (
                <>
                  {/* Duotone-tint i merkefarge */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-primary/45 mix-blend-multiply"
                  />
                  {/* Mykt fargedybde-overlegg (teal → coral) */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-br from-primary/30 via-transparent to-accent/50 mix-blend-screen"
                  />
                </>
              )}
            </div>
            {pills?.slice(0, PILL_POSITIONS.length).map((pill, index) => (
              <FloatingPill
                key={pill.label}
                className={PILL_POSITIONS[index] ?? ""}
                icon={pill.icon}
                label={pill.label}
              />
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}

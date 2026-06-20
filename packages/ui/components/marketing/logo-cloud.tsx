import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Reveal } from "../motion";

export interface Logo {
  name: string;
  /** Bilde-URL. Uten src vises navnet som en typografisk wordmark. */
  src?: string;
}

export interface LogoCloudProps {
  /** Liten ledetekst over logoene, f.eks. "Brukt av folk fra". */
  label?: string;
  logos: Logo[];
  /**
   * `default` står på en lys flate (logoene er gråtonet og lyser opp på hover).
   * `contrast` er ment for plassering oppå en farget/mørk `Section` — da antas
   * lyse/monokrome logoer og teksten blir lys.
   */
  variant?: "default" | "contrast";
}

/**
 * Logo-/bevis-stripe («brukt av», «som omtalt i»). Hver logo legges i en
 * fast-høyde tile med `object-contain`, slik at logoer med ulik intrinsisk
 * størrelse blir optisk balansert (lik høyde, naturlig bredde). Tåler mange
 * logoer — de legger seg i ryddige rader. Innholds-only.
 */
export function LogoCloud({
  label,
  logos,
  variant = "default",
}: LogoCloudProps) {
  const contrast = variant === "contrast";
  return (
    <Container padding="none">
      <Reveal>
        {label && (
          <div className="mb-10 text-center">
            <Eyebrow className={cn(contrast && "text-background/70")}>
              {label}
            </Eyebrow>
          </div>
        )}
        <div className="grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex h-10 w-full items-center justify-center md:h-12"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={cn(
                    "max-h-full w-auto max-w-[150px] object-contain transition-all duration-300",
                    contrast
                      ? "opacity-80 hover:opacity-100"
                      : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "font-bold font-heading text-2xl transition-colors duration-300 md:text-3xl",
                    contrast
                      ? "text-background/60 hover:text-background"
                      : "text-foreground/35 hover:text-foreground/70"
                  )}
                >
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </Container>
  );
}

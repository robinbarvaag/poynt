import { cn } from "../../lib/utils";
import { Container } from "../container";
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
}

/**
 * Logo-/bevis-stripe («brukt av», «som omtalt i»). Uten bilde vises navnet som
 * en dempet wordmark (ingen ikoner). Innholds-only.
 */
export function LogoCloud({ label, logos }: LogoCloudProps) {
  return (
    <Container padding="none">
      <Reveal>
        {label && (
          <p className="mb-10 text-center font-heading font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
            {label}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-16">
          {logos.map((logo) =>
            logo.src ? (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                className="h-8 w-auto opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-9"
              />
            ) : (
              <span
                key={logo.name}
                className={cn(
                  "font-bold font-heading text-2xl text-foreground/35 transition-colors duration-300 hover:text-foreground/70 md:text-3xl"
                )}
              >
                {logo.name}
              </span>
            )
          )}
        </div>
      </Reveal>
    </Container>
  );
}

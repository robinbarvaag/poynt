import { cn } from "@poynt/ui";
import {
  SocialIcon,
  type SocialLink,
  socialColor,
  socialLabel,
} from "./platforms";

interface SocialRowProps {
  links: SocialLink[];
  className?: string;
}

/**
 * Kanalrekken i footeren. Hver knapp henter merkefargen sin fra `--brand`,
 * så hover fargelegger ikonet og gløden uten en klasse per plattform.
 */
export function SocialRow({ links, className }: SocialRowProps) {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link, index) => {
        const label = socialLabel(link.platform);
        return (
          <li key={link.platform}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (åpnes i ny fane)`}
              style={
                {
                  "--brand": socialColor(link.platform),
                  "--enter-delay": `${index * 60}ms`,
                } as React.CSSProperties
              }
              className={cn(
                "group relative grid size-10 place-items-center rounded-xl text-muted-foreground",
                "bg-background/60 ring-1 ring-border/60 ring-inset",
                "transition-[color,transform,box-shadow,background-color] duration-300 ease-out",
                "hover:bg-background hover:text-[var(--brand)] hover:shadow-[0_8px_24px_-10px_var(--brand)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                "motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1",
                "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:[animation-delay:var(--enter-delay)]"
              )}
            >
              <SocialIcon
                platform={link.platform}
                className="size-[18px] transition-transform duration-300 ease-out motion-safe:group-hover:scale-110"
              />
              {/* Kanalnavnet som liten boble over ikonet — bare på pekerenheter. */}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 font-medium text-[11px] text-background opacity-0 shadow-sm transition-opacity duration-200 sm:block",
                  "group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
              >
                {label}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

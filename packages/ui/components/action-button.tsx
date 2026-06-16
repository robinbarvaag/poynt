import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

type Accent = "primary" | "saffron" | "salmon" | "ink";
type Size = "default" | "lg";

interface ActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode;
  /** Gjør knappen til en lenke i stedet for en <button>. */
  href?: string;
  accent?: Accent;
  size?: Size;
  /** Submit-type når det er en <button> (skjema-knapper). Default "button". */
  type?: "button" | "submit" | "reset";
}

// `base` ligger over `accent` i ro (aksenten peker fram som en hard skygge).
// Ved hover sklir aksenten inn og base fader bort, så aksenten dekker flata.
// `text` bytter farge samtidig så kontrasten holder i begge tilstander.
const themes = {
  primary: {
    base: "bg-primary",
    accent: "bg-saffron",
    text: "text-primary-foreground hover:text-foreground",
  },
  saffron: {
    base: "bg-saffron",
    accent: "bg-primary",
    text: "text-foreground hover:text-primary-foreground",
  },
  salmon: {
    base: "bg-salmon",
    accent: "bg-primary",
    text: "text-foreground hover:text-primary-foreground",
  },
  ink: {
    base: "bg-foreground",
    accent: "bg-saffron",
    text: "text-background hover:text-foreground",
  },
} as const;

const sizes = {
  default: "px-7 py-3 text-sm",
  lg: "px-9 py-3.5 text-base",
} as const;

/**
 * Leken CTA-knapp i Poynt-språket: en forskjøvet aksent-flate ligger bak (som
 * en hard skygge), og ved hover sklir den inn og dekker hele knappen mens
 * tekstfargen bytter — samme grep som fargeblokken bak ContentMedia-mediet.
 */
export function ActionButton({
  children,
  href,
  accent = "primary",
  size = "default",
  type = "button",
  className,
  ...props
}: ActionButtonProps) {
  const theme = themes[accent];
  const classes = cn(
    "group relative inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    theme.text,
    sizes[size],
    className
  );

  const layers = (
    <>
      {/* Aksent-flate (bak i ro, sklir inn ved hover) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 translate-x-2 translate-y-2 rounded-full transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0",
          theme.accent
        )}
      />
      {/* Base-flate (dekker i ro, fader bort ved hover) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-300 ease-out group-hover:opacity-0",
          theme.base
        )}
      />
      <span className="relative">{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {layers}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {layers}
    </button>
  );
}

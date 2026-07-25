"use client";

import Script from "next/script";

// Offisiell Vipps-knapp (web-komponent). Vipps' retningslinjer krever deres
// egen knappedesign for betaling — vi får ikke tegne vår egen. Scriptet
// dedupliseres av next/script ved flere instanser på samme side.
// Docs: https://developer.vippsmobilepay.com/docs/knowledge-base/buttons/
const VIPPS_BUTTON_SCRIPT =
  "https://cdn.vippsmobilepay.com/js/button/button.js";

// Web-komponenten leser attributter som strenger ("true"/"false").
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "vipps-mobilepay-button": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & {
          brand?: "vipps" | "mobilepay";
          language?: "no" | "en" | "dk" | "fi" | "sv";
          variant?: "primary" | "dark" | "light";
          rounded?: "true" | "false";
          verb?:
            | "buy"
            | "pay"
            | "login"
            | "register"
            | "continue"
            | "confirm"
            | "donate";
          stretched?: "true" | "false";
          compact?: "true" | "false";
          loading?: "true" | "false";
        };
      }
    }
  }
}

interface VippsButtonProps {
  onClick: () => void;
  /** Viser spinner i knappen og blokkerer nye klikk. */
  loading?: boolean;
  /** Blokkerer klikk (f.eks. mens annen checkout laster). */
  disabled?: boolean;
  /** Fyll tilgjengelig bredde. */
  stretched?: boolean;
  /** Lav variant for trange flater (sticky kjøpslinje). */
  compact?: boolean;
  verb?: "buy" | "pay";
  className?: string;
}

export function VippsButton({
  onClick,
  loading = false,
  disabled = false,
  stretched = false,
  compact = false,
  verb = "buy",
  className,
}: VippsButtonProps) {
  const blocked = loading || disabled;

  return (
    <div
      className={`${stretched ? "w-full" : ""} ${
        disabled ? "pointer-events-none opacity-50" : ""
      } ${className ?? ""}`.trim()}
      aria-disabled={disabled || undefined}
    >
      <Script src={VIPPS_BUTTON_SCRIPT} strategy="afterInteractive" />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: web-komponenten rendrer en ekte <button> internt — Enter/Space utløser click-eventen. */}
      <vipps-mobilepay-button
        brand="vipps"
        language="no"
        variant="primary"
        rounded="true"
        verb={verb}
        stretched={stretched ? "true" : "false"}
        compact={compact ? "true" : "false"}
        loading={loading ? "true" : "false"}
        onClick={() => {
          if (!blocked) {
            onClick();
          }
        }}
      />
    </div>
  );
}

import { cva } from "class-variance-authority";

// Felles høyde-skala for ALLE interaktive kontroller (Input, Textarea, Select,
// Button) slik at de stables side-ved-side med nøyaktig lik høyde. Endrer du en
// høyde her, følger hele felt-familien etter.
//   sm      = 36px (h-9)
//   default = 40px (h-10)
//   lg      = 44px (h-11)
//
// Button har sin egen cva (med egen horisontal padding/avrunding), men deler
// bevisst de samme h-9/h-10/h-11-tokenene — slik matcher `<Input sizeVariant>`
// og `<Button size>` med samme nøkkel hverandre i høyde.
export const CONTROL_HEIGHTS = {
  sm: "h-9",
  default: "h-10",
  lg: "h-11",
} as const;

export type ControlSize = keyof typeof CONTROL_HEIGHTS;

/**
 * Størrelses-variant for enkeltlinje-felt (Input, Select-trigger): høyde,
 * horisontal padding og skriftstørrelse i takt. Brukes via `sizeVariant`-prop.
 */
export const controlSizeVariants = cva("", {
  variants: {
    sizeVariant: {
      sm: "h-9 px-3 py-1.5 text-sm",
      default: "h-10 px-3.5 py-2 text-base",
      lg: "h-11 px-4 py-2.5 text-base",
    },
  },
  defaultVariants: {
    sizeVariant: "default",
  },
});

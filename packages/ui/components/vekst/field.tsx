"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { formatInput } from "./logic";

/** Felles stil for tallfeltene i kalkulatorene. */
export const numberInputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-base tabular-nums transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Enhet etter feltet, f.eks. «kr». */
  unit?: string;
  hint?: string;
}

/** Tallfelt med etikett og enhet. Tar imot norsk skrivemåte («1 250,5»). */
export function NumberField({
  id,
  label,
  value,
  onValueChange,
  unit,
  hint,
  className,
  onBlur,
  ...props
}: NumberFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-medium text-sm">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={(event) => {
            const formatted = formatInput(event.target.value);
            if (formatted !== event.target.value) onValueChange(formatted);
            onBlur?.(event);
          }}
          className={cn(numberInputClass, unit && "pr-12")}
          {...props}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-muted-foreground text-sm">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

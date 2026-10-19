"use client";

import type {
  ShippingAddressInput,
  ShippingErrors,
  ShippingField,
} from "@/lib/shipping-address";
import { Input, Label } from "@poynt/ui";
import { Truck } from "lucide-react";
import { useId } from "react";

interface FieldSpec {
  name: ShippingField;
  label: string;
  autoComplete: string;
  inputMode?: "numeric" | "tel";
  optional?: boolean;
  /** Tailwind-kolonner i det todelte rutenettet. */
  span?: "full" | "half";
}

const FIELDS: FieldSpec[] = [
  { name: "name", label: "Mottaker", autoComplete: "name", span: "full" },
  {
    name: "line1",
    label: "Gateadresse",
    autoComplete: "address-line1",
    span: "full",
  },
  {
    name: "line2",
    label: "Adresse, linje 2",
    autoComplete: "address-line2",
    optional: true,
    span: "full",
  },
  {
    name: "postalCode",
    label: "Postnummer",
    autoComplete: "postal-code",
    inputMode: "numeric",
    span: "half",
  },
  {
    name: "city",
    label: "Poststed",
    autoComplete: "address-level2",
    span: "half",
  },
  // Ikke telefon: vi sender som brev uten sporing, og Vipps/Stripe gir oss
  // kontaktinfo uansett. Minst mulig persondata.
];

/**
 * Leveringsadresse i handlekurven — vises bare når kurven har en vare som
 * krever frakt. Kontrollert skjema: eieren holder verdiene og feilene (fra
 * `validateShippingInput`), så begge betalingsknappene kan validere før de
 * sender kunden videre. Bare innenlands levering, derfor ingen landvelger.
 */
export function ShippingAddressForm({
  value,
  errors,
  onChange,
  className = "",
}: {
  value: ShippingAddressInput;
  errors: ShippingErrors;
  onChange: (next: ShippingAddressInput) => void;
  className?: string;
}) {
  const id = useId();

  return (
    <fieldset className={className}>
      <legend className="flex items-center gap-2 font-bold text-foreground">
        <Truck className="size-4 text-primary" />
        Leveringsadresse
      </legend>
      <p className="mt-1 text-muted-foreground text-sm">
        Varen sendes i posten. Vi leverer bare i Norge.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {FIELDS.map((field) => {
          const fieldId = `${id}-${field.name}`;
          const errorId = `${fieldId}-error`;
          const error = errors[field.name];
          return (
            <div
              key={field.name}
              className={field.span === "half" ? "col-span-1" : "col-span-2"}
            >
              <Label htmlFor={fieldId} className="mb-1.5">
                {field.label}
                {field.optional && (
                  <span className="font-normal text-muted-foreground">
                    (valgfritt)
                  </span>
                )}
              </Label>
              <Input
                id={fieldId}
                name={field.name}
                value={value[field.name]}
                onChange={(event) =>
                  onChange({ ...value, [field.name]: event.target.value })
                }
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                required={!field.optional}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="h-10 bg-background"
              />
              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-1 text-destructive text-xs"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

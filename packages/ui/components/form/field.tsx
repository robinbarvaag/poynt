"use client";

import * as React from "react";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

export interface FieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  /** Ledetekst over feltet. */
  label?: React.ReactNode;
  /** Hjelpetekst under feltet. */
  description?: React.ReactNode;
  /** react-hook-form valideringsregler (samme som FormField sin `rules`). */
  rules?: ControllerProps<TFieldValues, TName>["rules"];
  className?: string;
  /**
   * Selve kontrollen (Input/Textarea/Select/…). Feltets verdi, onChange, onBlur,
   * ref og name injiseres automatisk — så du slipper å koble dem manuelt.
   */
  children: React.ReactElement;
}

/**
 * Kortform for et komplett react-hook-form-felt: ledetekst + kontroll +
 * hjelpetekst + feilmelding i én komponent. Erstatter den manuelle stablingen
 * av FormField → FormItem → FormLabel → FormControl → FormMessage. Bruk de
 * underliggende byggeklossene direkte når du trenger et mer spesielt oppsett.
 */
export function Field<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  rules,
  className,
  children,
}: FieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {React.cloneElement(children, { ...field })}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

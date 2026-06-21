"use client";

import { ChevronLeft } from "lucide-react";
import * as React from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { cn } from "../lib/utils";
import { Sheet, SheetContent, SheetTitle } from "./sheet";

/**
 * `ListDetail` er en gjenbrukbar to-panel «master/detalj»-shell (à la en
 * e-postklient): en liste til venstre og en detaljvisning til høyre.
 *
 * - Desktop (≥ md): begge paneler vises side om side. Detaljpanelet viser
 *   `empty`-slotten når ingenting er valgt.
 * - Mobil (< md): kun lista vises; når noe velges åpnes detaljen i et
 *   fullbredde Sheet-overlay med tilbake-knapp.
 *
 * Valget er controlled via `value`/`onValueChange` (bind gjerne til en
 * URL-søkeparam) med uncontrolled fallback via `defaultValue`.
 *
 * Brukes av CRM (bedrifter), lagrede verktøy-resultater og medlemschat.
 */

type ListDetailContextValue = {
  value: string | null;
  setValue: (value: string | null) => void;
  isMobile: boolean;
};

const ListDetailContext = React.createContext<ListDetailContextValue | null>(
  null
);

export function useListDetail(): ListDetailContextValue {
  const ctx = React.useContext(ListDetailContext);
  if (!ctx) {
    throw new Error("useListDetail må brukes innenfor <ListDetail>");
  }
  return ctx;
}

export type ListDetailProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "value" | "defaultValue"
> & {
  /** Valgt id (controlled). */
  value?: string | null;
  /** Startverdi (uncontrolled). */
  defaultValue?: string | null;
  /** Kalles når valget endres — null betyr «ingen valgt». */
  onValueChange?: (value: string | null) => void;
  /** Bredde på listepanelet på desktop. Default 20rem. */
  listWidth?: string;
};

export function ListDetail({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  listWidth = "20rem",
  className,
  style,
  children,
  ...props
}: ListDetailProps) {
  const isMobile = useIsMobile();
  const [internal, setInternal] = React.useState<string | null>(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? (valueProp ?? null) : internal;

  const setValue = React.useCallback(
    (next: string | null) => {
      if (!isControlled) {
        setInternal(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const ctx = React.useMemo<ListDetailContextValue>(
    () => ({ value, setValue, isMobile }),
    [value, setValue, isMobile]
  );

  return (
    <ListDetailContext.Provider value={ctx}>
      <div
        data-slot="list-detail"
        style={
          {
            "--list-detail-list-width": listWidth,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "flex h-full min-h-0 w-full overflow-hidden rounded-3xl border bg-card",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ListDetailContext.Provider>
  );
}

export function ListDetailList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useListDetail();
  return (
    <div
      data-slot="list-detail-list"
      className={cn(
        "flex min-h-0 flex-col bg-card",
        isMobile
          ? "w-full"
          : "w-[var(--list-detail-list-width)] shrink-0 border-r",
        className
      )}
      {...props}
    />
  );
}

export function ListDetailListHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-detail-list-header"
      className={cn(
        "flex shrink-0 items-center gap-2 border-b px-3 py-2.5",
        className
      )}
      {...props}
    />
  );
}

export function ListDetailListContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-detail-list-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2",
        className
      )}
      {...props}
    />
  );
}

export type ListDetailRowProps = React.ComponentProps<"button"> & {
  /** Id-en denne raden representerer. Settes som valg ved klikk. */
  value: string;
};

export function ListDetailRow({
  value: rowValue,
  className,
  onClick,
  ...props
}: ListDetailRowProps) {
  const { value, setValue } = useListDetail();
  const active = value === rowValue;
  return (
    <button
      type="button"
      data-slot="list-detail-row"
      data-active={active}
      aria-current={active ? "true" : undefined}
      onClick={(event) => {
        setValue(rowValue);
        onClick?.(event);
      }}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

export type ListDetailDetailProps = React.ComponentProps<"div"> & {
  /** Vises på desktop når ingenting er valgt. */
  empty?: React.ReactNode;
};

export function ListDetailDetail({
  empty,
  className,
  children,
  ...props
}: ListDetailDetailProps) {
  const { isMobile, value, setValue } = useListDetail();

  if (isMobile) {
    return (
      <Sheet
        open={value != null}
        onOpenChange={(open) => {
          if (!open) {
            setValue(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-full",
            className
          )}
        >
          <SheetTitle className="sr-only">Detaljer</SheetTitle>
          {value != null ? children : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-slot="list-detail-detail"
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
        className
      )}
      {...props}
    >
      {value != null ? children : empty}
    </div>
  );
}

export function ListDetailDetailHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile, setValue } = useListDetail();
  return (
    <div
      data-slot="list-detail-detail-header"
      className={cn(
        "flex shrink-0 items-center gap-2 border-b px-4 py-3",
        className
      )}
      {...props}
    >
      {isMobile && (
        <button
          type="button"
          onClick={() => setValue(null)}
          aria-label="Tilbake"
          className="-ml-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-accent"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {children}
    </div>
  );
}

export function ListDetailDetailContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-detail-detail-content"
      className={cn("min-h-0 flex-1 overflow-y-auto p-4 md:p-6", className)}
      {...props}
    />
  );
}

export function ListDetailEmpty({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-detail-empty"
      className={cn(
        "flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

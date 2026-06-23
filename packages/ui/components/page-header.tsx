import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Eyebrow } from "./eyebrow";
import { Heading, Text } from "./typography";

export interface PageHeaderProps {
  /** Sidetittel (h1). */
  title: ReactNode;
  /** Kort beskrivelse under tittelen. */
  description?: ReactNode;
  /** Liten etikett over tittelen. */
  eyebrow?: ReactNode;
  /** Høyrestilt handling (knapp/lenke). */
  action?: ReactNode;
  className?: string;
}

/**
 * Felles sidetopp for medlemsområdet (og andre app-sider). Samler tittel +
 * beskrivelse + valgfri handling i ett konsistent oppsett, så hver side slipper
 * å rulle sin egen `<h1>`. Bruker `Heading`/`Text`/`Eyebrow` fra design-systemet.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading size="h2">{title}</Heading>
        {description && (
          <Text variant="muted" customStyles="max-w-2xl">
            {description}
          </Text>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

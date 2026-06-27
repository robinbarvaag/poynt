import { Card, CardContent, CardHeader, CardTitle, Text, cn } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import type { ReactNode } from "react";

export interface ReadinessField {
  label: string;
  /** Utfylt verdi fra profilen, eller `null` når feltet mangler. */
  value: string | null;
}

interface ToolReadinessProps {
  /** Korttittel — som regel «Dette bruker vi om deg». */
  title?: string;
  /** Kontekstlinje som forklarer tilstanden (komplett vs. mangler). */
  description?: ReactNode;
  fields: ReadinessField[];
  /** Knapperaden. Innringeren styrer gatingen (hva som er primær/sekundær). */
  children: ReactNode;
}

/**
 * Profil-bevisst readiness-kort, delt av de profilstyrte verktøyene
 * (Kanalveileder, Markedsplan, Årshjul). Viser hvilke profilfelt vi allerede
 * kjenner og hvilke som mangler — som en rolig sjekkliste, ikke løse badges —
 * og bærer den gatede handlingen. Selve gating-logikken (komplett → generer,
 * mangler → fullfør profilen) bestemmes av innringeren via `children`.
 */
export function ToolReadiness({
  title = "Dette bruker vi om deg",
  description,
  fields,
  children,
}: ToolReadinessProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <Text variant="muted" customStyles="text-sm">
            {description}
          </Text>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {fields.map((field) => {
            const known = Boolean(field.value);
            return (
              <li key={field.label} className="flex items-start gap-2.5">
                <Icon
                  name={known ? "check-circle" : "circle-off"}
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    known ? "text-primary" : "text-muted-foreground/50"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.1em]">
                    {field.label}
                  </p>
                  <p
                    className={cn(
                      "truncate text-sm",
                      known ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {field.value ?? "Mangler"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

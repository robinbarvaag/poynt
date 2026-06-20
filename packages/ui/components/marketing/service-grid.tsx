import { cn } from "../../lib/utils";
import { ServiceCard, type ServiceCardProps } from "./service-card";

export interface ServiceGridItem extends ServiceCardProps {
  id: string | number;
}

export interface ServiceGridProps {
  services: ServiceGridItem[];
  /** Antall kolonner på desktop. Default 3. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * Oversikt over tjenester du tilbyr — et rolig, uniformt rutenett av
 * `ServiceCard`. Bevisst nedtonet (ikke fargeblokker som produktene): det er en
 * tjeneste-meny, ikke en butikk. Presentasjons-only.
 */
export function ServiceGrid({
  services,
  columns = 3,
  className,
}: ServiceGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-10",
        columnClass[columns],
        className
      )}
    >
      {services.map(({ id, ...service }) => (
        <ServiceCard key={id} {...service} />
      ))}
    </div>
  );
}

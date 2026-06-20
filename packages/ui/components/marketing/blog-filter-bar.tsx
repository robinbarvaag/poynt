import { cn } from "../../lib/utils";
import { Input } from "../form/input";

export interface BlogCategoryOption {
  value: string;
  label: string;
}

export interface BlogFilterBarProps {
  categories: BlogCategoryOption[];
  /** Aktiv kategori, eller `null` for "alle". */
  activeCategory: string | null;
  onCategoryChange: (value: string | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  allLabel?: string;
  searchPlaceholder?: string;
  className?: string;
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-4 py-2 font-medium text-sm transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Filtrering for blogg-oversikten: kategori-piller + et søkefelt. Kontrollert —
 * eier ingen state selv; en klient-komponent (f.eks. BlogExplorer) holder aktiv
 * kategori og søketekst og filtrerer innleggene.
 */
export function BlogFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  query,
  onQueryChange,
  allLabel = "Alle innlegg",
  searchPlaceholder = "Søk i innlegg …",
  className,
}: BlogFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <Pill
          active={activeCategory === null}
          onClick={() => onCategoryChange(null)}
        >
          {allLabel}
        </Pill>
        {categories.map((category) => (
          <Pill
            key={category.value}
            active={activeCategory === category.value}
            onClick={() => onCategoryChange(category.value)}
          >
            {category.label}
          </Pill>
        ))}
      </div>

      <div className="relative w-full sm:w-64">
        <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 text-muted-foreground">
          <SearchIcon />
        </span>
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-full pl-10"
          aria-label="Søk i innlegg"
        />
      </div>
    </div>
  );
}

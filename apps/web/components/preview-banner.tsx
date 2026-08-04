import { Eye } from "lucide-react";

/**
 * Diskret banner som vises når draft mode er på: redaktøren ser et UTKAST,
 * ikke den publiserte siden — og trenger en tydelig vei ut igjen.
 */
export function PreviewBanner({ path }: { path: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 bg-foreground px-4 py-2 text-background text-sm print:hidden">
      <Eye className="size-4" />
      <span>
        Forhåndsvisning — du ser siste utkast, ikke den publiserte siden.
      </span>
      <a
        href={`/api/exit-preview?path=${encodeURIComponent(path)}`}
        className="rounded-full bg-background px-3 py-1 font-medium text-foreground transition hover:bg-background/90"
      >
        Avslutt
      </a>
    </div>
  );
}

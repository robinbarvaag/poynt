import { type PromptItem, PromptLibrary } from "@poynt/ui";

interface PromptRow {
  title: string;
  prompt: string;
  description?: string | null;
  tool?: string | null;
  tags?: string | null;
  id?: string | null;
}

interface PromptLibraryBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  prompts?: PromptRow[] | null;
  columns?: "1" | "2" | "3" | null;
}

/** Mapper Payload-blokken `promptLibrary` til PromptLibrary i @poynt/ui. */
export function PromptLibraryBlock({
  eyebrow,
  title,
  intro,
  prompts,
  columns,
}: PromptLibraryBlockProps) {
  const mapped: PromptItem[] = (prompts ?? [])
    .filter((row) => row.title && row.prompt)
    .map((row) => ({
      title: row.title,
      prompt: row.prompt,
      description: row.description ?? undefined,
      tool: row.tool ?? undefined,
      tags: row.tags
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }));

  if (mapped.length === 0) return null;

  const cols = Number(columns ?? "2");

  return (
    <PromptLibrary
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      prompts={mapped}
      columns={cols === 1 || cols === 3 ? cols : 2}
    />
  );
}

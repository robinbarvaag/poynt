import { type DocBlock, richDoc } from "@/scripts/_lexical";
export { lexicalToMarkdown } from "@/lib/serialize-guide-content";

/**
 * Enkel markdown → Lexical for richText-felter som kommer inn via MCP.
 * Støtter det redaktøren faktisk bruker i innholdsblokker: avsnitt (skilt med
 * blank linje), `## `/`### ` overskrifter, `- ` punktlister og `> ` sitat.
 * Inline-formatering (`**fet**`, `_kursiv_`, `[lenke](url)`) blir ekte
 * Lexical-noder via `inlineNodes` i scripts/_lexical. Motstykket til
 * `lexicalToMarkdown`.
 */
export function markdownToLexical(markdown: string) {
  const blocks: DocBlock[] = [];
  const chunks = markdown.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    let paragraph: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (paragraph.length) {
        blocks.push(paragraph.join(" "));
        paragraph = [];
      }
      if (list.length) {
        blocks.push({ list });
        list = [];
      }
    };

    for (const line of lines) {
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        flush();
        blocks.push({
          heading: heading[2],
          level: heading[1].length >= 3 ? 3 : 2,
        });
        continue;
      }
      const item = /^(?:[-*•]|\d+\.)\s+(.+)$/.exec(line);
      if (item) {
        if (paragraph.length) flush();
        list.push(item[1]);
        continue;
      }
      const quote = /^>\s?(.+)$/.exec(line);
      if (quote) {
        flush();
        blocks.push({ quote: quote[1] });
        continue;
      }
      if (list.length) flush();
      paragraph.push(line);
    }
    flush();
  }
  // lexicalToMarkdown skiller alle linjer med blank linje, også listepunkter.
  // Slå sammen nabolister så rundturen gir ÉN liste, ikke én per punkt.
  const merged: DocBlock[] = [];
  for (const block of blocks) {
    const prev = merged[merged.length - 1];
    if (
      typeof block === "object" &&
      "list" in block &&
      prev &&
      typeof prev === "object" &&
      "list" in prev
    ) {
      prev.list.push(...block.list);
    } else {
      merged.push(block);
    }
  }
  return richDoc(merged);
}

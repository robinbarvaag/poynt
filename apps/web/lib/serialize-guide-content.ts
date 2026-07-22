import type { Guide } from "@/payload-types";

/**
 * Gjør en guide om til lesbar markdown-tekst som en AI-modell kan vurdere.
 * Vi sender ikke rå Lexical-JSON (verbøst og støyete) – i stedet flater vi
 * blokkene ut til tekst med overskrifter, lister og lenker bevart, slik at
 * struktur og hierarki er synlig for modellen. Brukes av
 * `/api/ai/guide-review`.
 */

interface LexicalNode {
  type: string;
  tag?: string;
  text?: string;
  listType?: string;
  fields?: { url?: string; newTab?: boolean };
  url?: string;
  value?: { alt?: string; filename?: string };
  children?: LexicalNode[];
}

function inlineText(node: LexicalNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "link" || node.type === "autolink") {
    const label = (node.children ?? []).map(inlineText).join("");
    const url = node.fields?.url ?? node.url ?? "";
    return url ? `[${label}](${url})` : label;
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(inlineText).join("");
  }
  return "";
}

export function lexicalToMarkdown(content: unknown): string {
  const root = (content as { root?: { children?: LexicalNode[] } })?.root;
  if (!root?.children) return "";
  const lines: string[] = [];

  const walk = (nodes: LexicalNode[]) => {
    for (const node of nodes) {
      switch (node.type) {
        case "heading": {
          const level = Number.parseInt(
            (node.tag ?? "h2").replace("h", ""),
            10
          );
          const text = (node.children ?? []).map(inlineText).join("");
          if (text) lines.push(`${"#".repeat(level)} ${text}`);
          break;
        }
        case "paragraph": {
          const text = (node.children ?? []).map(inlineText).join("");
          if (text.trim()) lines.push(text);
          break;
        }
        case "list": {
          const ordered = node.listType === "number";
          (node.children ?? []).forEach((item, i) => {
            const bullet = ordered ? `${i + 1}.` : "-";
            const text = (item.children ?? []).map(inlineText).join("");
            if (text.trim()) lines.push(`${bullet} ${text}`);
          });
          break;
        }
        case "upload": {
          // Innfelt bilde i richText — synlig for AI-vurderingen som bildebruk.
          const media =
            typeof node.value === "object" && node.value ? node.value : null;
          lines.push(`[Bilde${media?.alt ? `: ${media.alt}` : ""}]`);
          break;
        }
        case "quote": {
          const text = (node.children ?? []).map(inlineText).join("");
          if (text.trim()) lines.push(`> ${text}`);
          break;
        }
        default: {
          if (node.children && Array.isArray(node.children))
            walk(node.children);
        }
      }
    }
  };

  walk(root.children);
  return lines.join("\n\n");
}

/**
 * Stabil, rask hash (djb2) av det serialiserte innholdet. Lagres sammen med
 * kvalitetsvurderingen slik at vi deterministisk kan se om innholdet er endret
 * siden sist vurdering (utdatert score) – uten tidsmarginer.
 */
export function hashGuideContent(markdown: string): string {
  let h = 5381;
  for (let i = 0; i < markdown.length; i++) {
    h = ((h << 5) + h + markdown.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Serialiserer hele guidens innhold (alle blokker, i rekkefølge) til markdown. */
export function serializeGuideContent(guide: Guide): string {
  const parts: string[] = [];
  parts.push(`# ${guide.title}`);
  if (guide.lede) parts.push(`_Ingress:_ ${guide.lede}`);

  for (const block of guide.content ?? []) {
    switch (block.blockType) {
      case "guideRichText":
        parts.push(lexicalToMarkdown(block.content));
        break;
      case "guideCallout":
        parts.push(
          `> [Infoboks${block.tone ? ` – ${block.tone}` : ""}] ${lexicalToMarkdown(block.content)}`
        );
        break;
      case "guideColumns":
        for (const col of block.columns ?? []) {
          if (col.type === "text" && col.content) {
            parts.push(lexicalToMarkdown(col.content));
          } else if (col.caption) {
            parts.push(`[Bilde: ${col.caption}]`);
          }
        }
        break;
      case "guideToggle":
        for (const item of block.items ?? []) {
          parts.push(
            `**${item.title}** (sammenleggbar)\n${lexicalToMarkdown(item.content)}`
          );
        }
        break;
      case "guideBookmark":
        for (const item of block.items ?? []) {
          parts.push(
            `[Lenke] ${item.title ?? ""} – ${item.url ?? ""}${item.description ? ` (${item.description})` : ""}`
          );
        }
        break;
      case "guideDownload":
        for (const item of block.items ?? []) {
          parts.push(
            `[Nedlasting: ${item.kind ?? "fil"}] ${item.title}${item.description ? ` – ${item.description}` : ""}`
          );
        }
        break;
      case "guideVideo":
        parts.push(`[Video] ${block.caption ?? block.url ?? ""}`);
        break;
      case "guideImage":
        parts.push(`[Bilde${block.caption ? `: ${block.caption}` : ""}]`);
        break;
      case "guideGallery":
        parts.push(`[Bildegalleri med ${(block.images ?? []).length} bilder]`);
        break;
      case "guideDivider":
        parts.push("---");
        break;
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

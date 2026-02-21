import { generateSlug } from "./generate-slug";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface LexicalNode {
  type: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
}

function extractTextFromNode(node: LexicalNode): string {
  if (node.type === "text") return node.text || "";
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }
  return "";
}

export function extractToc(content: {
  root: { children: LexicalNode[] };
}): TocItem[] {
  const headings: TocItem[] = [];

  if (!content?.root?.children) return headings;

  for (const node of content.root.children) {
    if (node.type === "heading" && (node.tag === "h2" || node.tag === "h3")) {
      const text = extractTextFromNode(node);
      if (text) {
        headings.push({
          id: generateSlug(text),
          text,
          level: Number.parseInt(node.tag.replace("h", ""), 10),
        });
      }
    }
  }

  return headings;
}

/**
 * Ren tekst ut av et Lexical-dokument, som avsnitt. Brukes der richText skal
 * inn i e-post eller kalenderfil, som ikke kan vise formatering.
 */

interface LexicalNode {
  type?: string;
  text?: string;
  children?: LexicalNode[];
}

function nodeText(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  if (node.type === "linebreak") return "\n";
  return (node.children ?? []).map(nodeText).join("");
}

export function lexicalParagraphs(value: unknown): string[] {
  const root = (value as { root?: LexicalNode } | null | undefined)?.root;
  if (!root?.children) return [];

  const paragraphs: string[] = [];
  for (const node of root.children) {
    if (node.type === "list") {
      for (const item of node.children ?? []) {
        const text = nodeText(item).trim();
        if (text) paragraphs.push(`• ${text}`);
      }
      continue;
    }
    const text = nodeText(node).trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

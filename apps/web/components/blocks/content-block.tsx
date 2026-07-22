import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Container } from "@poynt/ui";

interface ContentBlockProps {
  richText: SerializedEditorState; // Lexical JSON
}

export function ContentBlock({ richText }: ContentBlockProps) {
  if (!richText) {
    return null;
  }

  // Løpende tekst får lesebredde (max-w-3xl), men VENSTRESTILT inne i den
  // felles containeren — deler venstrekant med resten av siden i stedet for å
  // sentreres som sin egen kolonne.
  return (
    <Container padding="none">
      <div className="max-w-3xl text-lg text-muted-foreground rich-text">
        <RichText data={richText} />
      </div>
    </Container>
  );
}

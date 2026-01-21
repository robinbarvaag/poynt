import { RichText } from "@payloadcms/richtext-lexical/react";

interface ContentBlockProps {
  richText: any; // Lexical JSON
}

export function ContentBlock({ richText }: ContentBlockProps) {
  if (!richText) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-lg text-muted-foreground rich-text">
          <RichText data={richText} />
        </div>
      </div>
    </section>
  );
}

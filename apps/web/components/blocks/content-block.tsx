interface ContentBlockProps {
  richText: any; // Lexical JSON
}

export function ContentBlock({ richText }: ContentBlockProps) {
  // TODO: Implementer Lexical renderer
  // For no brukar me ein enkel placeholder
  return (
    <div className="prose prose-lg max-w-none">
      <p className="text-muted-foreground">
        [Rich text content vil bli rendera her med Lexical]
      </p>
    </div>
  );
}

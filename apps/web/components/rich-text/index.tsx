import { linkConverters } from "@/components/rich-text/link-converters";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  type JSXConvertersFunction,
  RichText as PayloadRichText,
} from "@payloadcms/richtext-lexical/react";

/** Payloads standardkonvertere + våre lenker. */
export const richTextConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  ...linkConverters,
});

interface RichTextProps {
  data: SerializedEditorState;
  className?: string;
  disableContainer?: boolean;
}

/**
 * Standard richText-rendring på nettsiden. Bruk denne i stedet for
 * `RichText` fra `@payloadcms/richtext-lexical/react` direkte, så lenker
 * (interne, eksterne, e-post, telefon) oppfører seg likt overalt.
 * Trenger du egne konvertere i tillegg, spre inn `linkConverters` selv.
 */
export function RichText({ data, className, disableContainer }: RichTextProps) {
  return (
    <PayloadRichText
      converters={richTextConverters}
      data={data}
      className={className}
      disableContainer={disableContainer}
    />
  );
}

export { linkConverters } from "@/components/rich-text/link-converters";

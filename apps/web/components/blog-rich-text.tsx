import { ProductSpotlightCard } from "@/components/product-spotlight";
import { linkConverters } from "@/components/rich-text";
import type { ProductSpotlightBlock } from "@/payload-types";
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
} from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  type JSXConvertersFunction,
  RichText,
} from "@payloadcms/richtext-lexical/react";

type BlogNodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<ProductSpotlightBlock>;

/**
 * Lexical → JSX for blogginnlegg og kundehistorier: standard-konverterne pluss «Produktkort»-
 * blokken redaktøren kan sette inn i teksten. Kortet bryter ut av prose-
 * typografien (`not-prose`) og får egen luft over og under.
 */
const converters: JSXConvertersFunction<BlogNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  ...linkConverters,
  blocks: {
    productSpotlight: ({ node }) => (
      <div className="not-prose my-10">
        <ProductSpotlightCard
          product={node.fields.product}
          eyebrow={node.fields.eyebrow}
          text={node.fields.text}
          showAddToCart={node.fields.showAddToCart}
        />
      </div>
    ),
  },
});

/** Server-rendret innholdstekst for blogginnlegg og kundehistorier (må kunne hente produkter). */
export function BlogRichText({ data }: { data: SerializedEditorState }) {
  return <RichText converters={converters} data={data} />;
}

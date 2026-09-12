import { ProductSpotlightCard } from "@/components/product-spotlight";
import type { ProductSpotlightBlock as ProductSpotlightBlockData } from "@/payload-types";

type ProductSpotlightBlockProps = Omit<
  ProductSpotlightBlockData,
  "id" | "blockName" | "blockType"
>;

/**
 * Sideblokk-varianten av «Produktkort». Rendres gjennom den sentrale
 * BlockSection (delt spacing/bredde) og holdes smalere enn full innholds-
 * bredde, så kortet leses som et innslag og ikke en hel seksjon.
 */
export function ProductSpotlightBlock(props: ProductSpotlightBlockProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProductSpotlightCard {...props} />
    </div>
  );
}

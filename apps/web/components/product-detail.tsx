"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import { ProductStorySections } from "@/components/product/product-story-sections";
import { PRODUCT_TYPE_LABELS, getProductBadge } from "@/lib/product";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Product } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Heading,
  Lightbox,
  ProductGrid,
  type ProductGridItem,
  Text,
} from "@poynt/ui";
import { ArrowRight, Info, Minus, Plus } from "lucide-react";
import Link from "next/link";
import {
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: ProductGridItem[];
}

// Status-merkelappens fargetone → Badge-variant på produktsiden.
const badgeToneToVariant = {
  new: "saffron",
  presale: "salmon",
  soldout: "muted",
  neutral: "outline",
} as const;

// Medlemskap kjøpes ikke direkte – det krever en søknad. Knappen lenker til
// søknads-/kontaktsiden (styrt av `applyUrl` på produktet, default «/kontakt»).
function MembershipApplyButton({ product }: { product: Product }) {
  const applyUrl = product.applyUrl?.trim() || "/kontakt";

  return (
    <div className="space-y-3">
      <Button asChild size="lg" className="w-full">
        <Link href={applyUrl}>Søk om medlemskap</Link>
      </Button>
      <Text variant="muted" customStyles="text-sm">
        Medlemskapet kan ikke kjøpes direkte – send en kort søknad, så tar vi
        kontakt.
      </Text>
    </div>
  );
}

// Antall-stepper: bor inne i samme pill som kjøpsknappen, slik at antall og
// kjøp leses som ÉN handling i stedet for to adskilte felt. `compact` brukes
// i den sticky kjøpslinja der plassen er trangere.
function QuantityStepper({
  quantity,
  setQuantity,
  compact = false,
}: {
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  compact?: boolean;
}) {
  const buttonSize = compact ? "size-8" : "size-9";
  return (
    <fieldset aria-label="Antall" className="flex items-center gap-0.5 px-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Færre"
        className={`${buttonSize} rounded-full`}
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        disabled={quantity <= 1}
      >
        <Minus className="size-4" />
      </Button>
      <span
        className={`text-center font-medium tabular-nums ${
          compact ? "min-w-6 text-sm" : "min-w-8"
        }`}
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Flere"
        className={`${buttonSize} rounded-full`}
        onClick={() => setQuantity((q) => q + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </fieldset>
  );
}

// Sticky kjøpslinje: glir inn nederst når kjøpsboksen er scrollet forbi
// (oppover ut av viewporten). Bunnen – ikke toppen – fordi headeren allerede
// eier toppen (fixed + vis-ved-scroll-opp), og bunnen er tommel-sonen på
// mobil. z-40 ligger bevisst under headerens z-50.
//
// `position: sticky` (ikke fixed) med plassering SIST i sideinnholdet: linja
// henger på viewport-bunnen mens man scroller, og når man når bunnen av siden
// legger den seg naturlig til ro på sin egen plass over footeren – i stedet
// for å dekke footeren eller brått forsvinne.
function StickyBuyBar({
  targetRef,
  productName,
  priceInKr,
  media,
  wideControls = false,
  children,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  productName: string;
  priceInKr: string;
  media?: MediaResource;
  /** Når kontrollene inneholder antall-stepper: la dem ta hele bredden på
      mobil og gjem navn/pris (navnet er uansett åpenbart på produktsiden). */
  wideControls?: boolean;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      // Kun når boksen har passert OVER viewporten – ikke ved sidelast der
      // den fortsatt ligger nedenfor (da er linja bare støy).
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  return (
    <div
      inert={!visible}
      className={`sticky bottom-0 z-40 border-border border-t bg-background/90 backdrop-blur-xl transition-transform duration-300 ease-drawer motion-reduce:transition-opacity motion-reduce:duration-200 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 motion-reduce:translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        {media && (
          <div className="relative hidden size-11 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
            <PayloadImage
              media={media}
              alt={media.alt || productName}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div
          className={`min-w-0 flex-1 ${wideControls ? "hidden sm:block" : ""}`}
        >
          <p className="truncate font-medium text-sm">{productName}</p>
          <p className="text-muted-foreground text-sm">{priceInKr} kr</p>
        </div>
        <div
          className={wideControls ? "min-w-0 flex-1 sm:flex-none" : "shrink-0"}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ProductDetailClient({
  product,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const badge = getProductBadge(product);
  const isSoldOut = product.statusBadge === "soldout";

  // Kjøpsboksen observeres av den sticky kjøpslinja: når boksen scrolles ut
  // av viewporten (oppover), glir linja inn nederst.
  const buyBoxRef = useRef<HTMLDivElement>(null);

  // Variant (f.eks. signert/usignert) – én dimensjon per produkt.
  const variantOptions = product.variantOptions ?? [];
  const hasVariants =
    Boolean(product.variantLabel) && variantOptions.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    undefined
  );
  const selectedOption = hasVariants
    ? variantOptions.find((o) => o.label === selectedVariant)
    : undefined;
  const priceDelta = selectedOption?.priceDelta ?? 0;
  const effectivePrice = product.price + priceDelta;

  // Antall – kun for produkter som tillater det (digitale: alltid 1).
  const allowQuantity = Boolean(product.allowQuantity);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = allowQuantity ? undefined : 1;

  const priceInKr = effectivePrice.toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? product.compareAtPrice.toLocaleString("nb-NO")
    : null;
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  // Build image array from featuredImage and gallery. Vi beholder hele media-
  // objektet (ikke bare url/alt) så fokuspunkt o.l. flyter til PayloadImage.
  const images: { media: MediaResource; caption?: string }[] = [];
  if (
    product.featuredImage &&
    typeof product.featuredImage !== "number" &&
    product.featuredImage.url
  ) {
    images.push({ media: product.featuredImage });
  }
  if (product.gallery) {
    for (const item of product.gallery) {
      if (item.image && typeof item.image !== "number" && item.image.url) {
        images.push({
          media: item.image,
          caption: item.caption ?? undefined,
        });
      }
    }
  }

  const currentImage = images[selectedImage];

  return (
    <>
      <Container padding="default">
        <Breadcrumbs
          items={detailBreadcrumbs("produkter", product.name)}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start lg:gap-16">
          {/* Bildet pinnes mens teksten til høyre scroller forbi – fyller luft
            uten å gjemme brødteksten bak tabs. */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="relative">
              {/* Lekent blob-pek bak bildet (INSPO/Steady-signaturen) */}
              <span
                aria-hidden="true"
                className="-top-5 -left-5 absolute size-32 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-accent-1 opacity-70 blur-[2px]"
              />
              <div className="relative z-10 aspect-square w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
                {currentImage ? (
                  <Lightbox
                    src={resolveMediaUrl(currentImage.media)}
                    alt={currentImage.media.alt || product.name}
                    caption={currentImage.caption}
                    tone="salmon"
                    className="h-full"
                  >
                    <PayloadImage
                      media={currentImage.media}
                      alt={currentImage.media.alt || product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </Lightbox>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                    <span className="text-6xl">📦</span>
                  </div>
                )}

                {hasDiscount && (
                  <span className="absolute top-4 right-4 rounded-full bg-accent-1 px-4 py-1.5 font-semibold text-foreground text-sm shadow-sm">
                    Tilbud
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    type="button"
                    // biome-ignore lint/suspicious/noArrayIndexKey: Using index as key is acceptable here because the list is static and does not change order
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <PayloadImage
                      media={img.media}
                      alt={img.media.alt || `Bilde ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="soft-saffron" size="lg">
                {PRODUCT_TYPE_LABELS[product.type] || product.type}
              </Badge>
              {badge && (
                <Badge
                  variant={badgeToneToVariant[badge.tone ?? "neutral"]}
                  size="lg"
                >
                  {badge.label}
                </Badge>
              )}
            </div>

            <Heading
              size="h1"
              color="foreground"
              weight="bold"
              customStyles="mb-4"
            >
              {product.name}
            </Heading>

            {product.shortDescription && (
              <Text variant="lead" customStyles="mb-6">
                {product.shortDescription}
              </Text>
            )}

            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <Text
                  type="span"
                  size="display-md"
                  weight="bold"
                  color="primary"
                  customStyles="leading-none"
                >
                  {priceInKr} kr
                </Text>
                {hasDiscount && (
                  <Text
                    type="span"
                    variant="muted"
                    customStyles="text-xl line-through"
                  >
                    {compareAtPriceInKr} kr
                  </Text>
                )}
              </div>
              <Text variant="muted" customStyles="mt-1">
                {product.type === "membership" && product.recurringInterval
                  ? product.recurringInterval === 1
                    ? "per måned"
                    : `hver ${product.recurringInterval}. måned`
                  : "Inkl. mva"}
              </Text>
            </div>

            {/* Forhåndssalg / merknad – oppmerksomhets-callout (accent-5/saffron)
              rett over kjøpsknappen: ikon + tittel på én linje, teksten under. */}
            {product.notice && (
              <div className="rounded-3xl bg-accent-5/20 p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-5 text-accent-5-foreground"
                  >
                    <Info className="size-4" />
                  </span>
                  <Text weight="semibold" customStyles="text-sm">
                    {product.noticeTitle || "Godt å vite"}
                  </Text>
                </div>
                <Text customStyles="mt-2 pl-10 text-sm leading-relaxed">
                  {product.notice}
                </Text>
              </div>
            )}

            <div ref={buyBoxRef} className="space-y-5 pt-6">
              {/* Variant som pill-knapper (ikke dropdown) – alle valg er synlige
                med én gang, og at valget MÅ tas kommer tydelig frem. */}
              {product.type !== "membership" && !isSoldOut && hasVariants && (
                <div>
                  <Text weight="medium" customStyles="mb-2 text-sm">
                    {product.variantLabel}
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {variantOptions.map((option) => {
                      const checked = selectedVariant === option.label;
                      return (
                        /* Skjult native radio i en pill-label: gratis tastatur-
                         navigasjon og riktig semantikk, uten synlig sirkel. */
                        <label
                          key={option.id}
                          className={`pressable inline-flex h-11 cursor-pointer items-center rounded-full border-2 px-5 font-medium text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 ${
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`variant-${product.id}`}
                            value={option.label ?? ""}
                            checked={checked}
                            onChange={() =>
                              setSelectedVariant(option.label ?? undefined)
                            }
                            className="sr-only"
                          />
                          {option.label}
                          {option.priceDelta ? (
                            <span
                              className={`ml-1.5 text-xs ${
                                checked
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {option.priceDelta > 0 ? "+" : ""}
                              {option.priceDelta} kr
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.type === "membership" ? (
                <MembershipApplyButton product={product} />
              ) : isSoldOut ? (
                <Button size="lg" className="w-full" disabled>
                  Utsolgt
                </Button>
              ) : (
                /* Antall bor INNE i samme pill som kjøpsknappen – antall og
                 kjøp leses som én handling, og trenger ingen egen etikett. */
                <div
                  className={
                    allowQuantity
                      ? "flex items-stretch overflow-hidden rounded-2xl border border-border bg-card"
                      : undefined
                  }
                >
                  {allowQuantity && (
                    <QuantityStepper
                      quantity={quantity}
                      setQuantity={setQuantity}
                    />
                  )}
                  <AddToCartButton
                    product={{
                      id: String(product.id),
                      name: product.name,
                      price: effectivePrice,
                      slug: product.slug ?? undefined,
                      image: images[0]
                        ? resolveMediaUrl(images[0].media)
                        : undefined,
                    }}
                    variantLabel={
                      hasVariants
                        ? (product.variantLabel ?? undefined)
                        : undefined
                    }
                    variantValue={selectedVariant}
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    allowQuantity={allowQuantity}
                    disabled={hasVariants && !selectedVariant}
                    disabledLabel={`Velg ${product.variantLabel ?? "alternativ"}`}
                    className={
                      allowQuantity ? "min-w-0 rounded-none" : undefined
                    }
                  />
                </div>
              )}
            </div>

            {/* Salgspunkter – løftes frem rett under kjøpsknappen, ikke gjemt i
              brødteksten. Dynamisk liste fra produktet (emoji + kort tekst). */}
            {product.highlights && product.highlights.length > 0 && (
              <ul className="mt-5 grid gap-2.5">
                {product.highlights.map((highlight) => (
                  <li
                    key={highlight.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    {highlight.icon && (
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-1/40 text-lg leading-none"
                      >
                        {highlight.icon}
                      </span>
                    )}
                    <Text weight="medium" customStyles="text-sm leading-snug">
                      {highlight.text}
                    </Text>
                  </li>
                ))}
              </ul>
            )}

            {/* Brødteksten ligger i høyre kolonne så den fyller plassen ved
              siden av det sticky bildet i stedet for å ligge langt nede. */}
            {product.description && (
              <div className="mt-10 border-t border-border pt-10">
                <Heading variant="h4" color="foreground" customStyles="mb-5">
                  Om produktet
                </Heading>
                <div className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground rich-text">
                  <RichText data={product.description} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Datadrevne «historie»-seksjoner: mellomlang beskrivelse, bakside,
          lesersitater, PDF-smakebit og video. Vises i full bredde under den
          delte topp-seksjonen – felles for alle produkttyper. */}
        <ProductStorySections product={product} />

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-border">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Heading size="h2" color="foreground">
                Andre produkter
              </Heading>
              <Link
                href="/produkter"
                className="inline-flex shrink-0 items-center gap-2 font-medium text-primary hover:underline"
              >
                Se alle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ProductGrid products={relatedProducts} featureFirst={false} />
          </div>
        )}
      </Container>

      {/* Sticky kjøpslinje for kjøpbare produkter – SIST i sideinnholdet
          (utenfor Container) så `position: sticky` kan parkere den over
          footeren når man når bunnen. Mangler variantvalg, scroller knappen
          deg tilbake til valget i stedet for å være død. */}
      {product.type !== "membership" && !isSoldOut && (
        <StickyBuyBar
          targetRef={buyBoxRef}
          productName={product.name}
          priceInKr={priceInKr}
          media={images[0]?.media}
          wideControls={allowQuantity && !(hasVariants && !selectedVariant)}
        >
          {hasVariants && !selectedVariant ? (
            <Button
              size="lg"
              onClick={() =>
                buyBoxRef.current?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                  ).matches
                    ? "auto"
                    : "smooth",
                  block: "center",
                })
              }
            >
              Velg {product.variantLabel ?? "alternativ"}
            </Button>
          ) : (
            /* Samme samlede pill som i kjøpsboksen (kompakt stepper), så
               antall kan justeres uten å scrolle tilbake opp. */
            <div
              className={
                allowQuantity
                  ? "flex items-stretch overflow-hidden rounded-2xl border border-border bg-card"
                  : undefined
              }
            >
              {allowQuantity && (
                <QuantityStepper
                  quantity={quantity}
                  setQuantity={setQuantity}
                  compact
                />
              )}
              <AddToCartButton
                product={{
                  id: String(product.id),
                  name: product.name,
                  price: effectivePrice,
                  slug: product.slug ?? undefined,
                  image: images[0]
                    ? resolveMediaUrl(images[0].media)
                    : undefined,
                }}
                variantLabel={
                  hasVariants ? (product.variantLabel ?? undefined) : undefined
                }
                variantValue={selectedVariant}
                quantity={quantity}
                maxQuantity={maxQuantity}
                allowQuantity={allowQuantity}
                className={allowQuantity ? "min-w-0 rounded-none" : undefined}
              />
            </div>
          )}
        </StickyBuyBar>
      )}
    </>
  );
}

export { ProductDetailClient };

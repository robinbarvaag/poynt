"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { VippsButton } from "@/components/vipps-button";
import { startVippsBuyNow } from "@/lib/vipps-checkout-client";
import type { Product } from "@/payload-types";
import { Button, Container, Text } from "@poynt/ui";
import { Minus, Plus } from "lucide-react";
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

/** Minimal, serialiserbar delmengde av produktets variantvalg. */
export interface ProductVariantOption {
  id?: string | null;
  label: string;
  priceDelta?: number | null;
}

/** De minimale produktfeltene kjøpsflyten trenger – IKKE hele Payload-dokumentet. */
export interface ProductPurchaseInfo {
  /** Payload-ID som streng – brukes i handlekurven og som radio-`name`. */
  id: string;
  name: string;
  slug: string;
  type: Product["type"];
  /** Grunnpris i kr, før variant-tillegg. */
  price: number;
  isSoldOut: boolean;
  allowQuantity: boolean;
  /** Variant-spørsmål, f.eks. «Signert?». Tom = ingen varianter. */
  variantLabel?: string;
  variantOptions: ProductVariantOption[];
  /** Søknadslenke for medlemskap (default «/kontakt»). */
  applyUrl?: string;
  hasDiscount: boolean;
  /** Ferdig formatert førpris, eller null uten tilbud. */
  compareAtPriceInKr: string | null;
  /** Teksten under prisen («Inkl. mva» / «per måned») – regnet ut på serveren. */
  priceSuffix: string;
}

interface ProductDetailInteractiveProps {
  info: ProductPurchaseInfo;
  /** Bilde-URL til handlekurvlinja (første produktbilde). */
  cartImageUrl?: string;
  /** Media for miniatyren i den sticky kjøpslinja. */
  stickyMedia?: MediaResource;
  /** Server-rendrede statiske deler sendes inn som ferdig JSX, slik at tungt
      innhold (rik tekst, historie-seksjoner, relaterte produkter) ikke
      serialiseres til denne klientkomponenten. */
  breadcrumbs: ReactNode;
  gallery: ReactNode;
  header: ReactNode;
  notice: ReactNode;
  highlights: ReactNode;
  description: ReactNode;
  storySections: ReactNode;
  related: ReactNode;
}

// Medlemskap kjøpes ikke direkte – det krever en søknad. Knappen lenker til
// søknads-/kontaktsiden (styrt av `applyUrl` på produktet, default «/kontakt»).
function MembershipApplyButton({ applyUrl }: { applyUrl?: string }) {
  const href = applyUrl?.trim() || "/kontakt";

  return (
    <div className="space-y-3">
      <Button asChild size="lg" className="w-full">
        <Link href={href}>Søk om medlemskap</Link>
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

/**
 * Klient-skallet rundt produktsiden: eier delt kjøps-state (variantvalg,
 * antall, Vipps-status) som både prisvisningen, kjøpsboksen og den sticky
 * kjøpslinja trenger. Alt statisk innhold kommer ferdig server-rendret inn
 * som JSX-props (`header`, `description`, `storySections`, …).
 */
function ProductDetailInteractive({
  info,
  cartImageUrl,
  stickyMedia,
  breadcrumbs,
  gallery,
  header,
  notice,
  highlights,
  description,
  storySections,
  related,
}: ProductDetailInteractiveProps) {
  const { isSoldOut, allowQuantity } = info;

  // Kjøpsboksen observeres av den sticky kjøpslinja: når boksen scrolles ut
  // av viewporten (oppover), glir linja inn nederst.
  const buyBoxRef = useRef<HTMLDivElement>(null);

  // Variant (f.eks. signert/usignert) – én dimensjon per produkt.
  const variantOptions = info.variantOptions;
  const hasVariants = Boolean(info.variantLabel) && variantOptions.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    undefined
  );
  const selectedOption = hasVariants
    ? variantOptions.find((o) => o.label === selectedVariant)
    : undefined;
  const priceDelta = selectedOption?.priceDelta ?? 0;
  const effectivePrice = info.price + priceDelta;

  // Antall – kun for produkter som tillater det (digitale: alltid 1).
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = allowQuantity ? undefined : 1;

  // Vipps-hurtigkasse rett fra produktsiden: hopper over handlekurven og
  // sender kun dette produktet (medlemskap støttes ikke — API-et avviser).
  const [vippsLoading, setVippsLoading] = useState(false);
  const [vippsError, setVippsError] = useState<string | null>(null);
  const handleVippsBuyNow = async () => {
    setVippsLoading(true);
    setVippsError(null);
    try {
      await startVippsBuyNow({
        id: info.id,
        quantity,
        variant: selectedVariant,
      });
    } catch (error) {
      console.error("Vipps checkout error:", error);
      setVippsError(error instanceof Error ? error.message : "Noe gikk galt");
      setVippsLoading(false);
    }
  };

  const priceInKr = effectivePrice.toLocaleString("nb-NO");

  return (
    <>
      <Container padding="default">
        {breadcrumbs}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start lg:gap-16">
          {gallery}

          <div className="flex flex-col">
            {header}

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
                {info.hasDiscount && (
                  <Text
                    type="span"
                    variant="muted"
                    customStyles="text-xl line-through"
                  >
                    {info.compareAtPriceInKr} kr
                  </Text>
                )}
              </div>
              <Text variant="muted" customStyles="mt-1">
                {info.priceSuffix}
              </Text>
            </div>

            {notice}

            <div ref={buyBoxRef} className="space-y-5 pt-6">
              {/* Variant som pill-knapper (ikke dropdown) – alle valg er synlige
                med én gang, og at valget MÅ tas kommer tydelig frem. */}
              {info.type !== "membership" && !isSoldOut && hasVariants && (
                <div>
                  <Text weight="medium" customStyles="mb-2 text-sm">
                    {info.variantLabel}
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
                            name={`variant-${info.id}`}
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

              {info.type === "membership" ? (
                <MembershipApplyButton applyUrl={info.applyUrl} />
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
                      id: info.id,
                      name: info.name,
                      price: effectivePrice,
                      slug: info.slug,
                      image: cartImageUrl,
                    }}
                    variantLabel={
                      hasVariants ? (info.variantLabel ?? undefined) : undefined
                    }
                    variantValue={selectedVariant}
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    allowQuantity={allowQuantity}
                    disabled={hasVariants && !selectedVariant}
                    disabledLabel={`Velg ${info.variantLabel ?? "alternativ"}`}
                    className={
                      allowQuantity ? "min-w-0 rounded-none" : undefined
                    }
                  />
                </div>
              )}

              {/* Vipps-hurtigkasse under kjøpsknappen — offisiell knapp
                (retningslinjene tillater ikke egen design). Deaktivert til
                variant er valgt, samme regel som kjøpsknappen. */}
              {info.type !== "membership" && !isSoldOut && (
                <VippsButton
                  stretched
                  loading={vippsLoading}
                  disabled={hasVariants && !selectedVariant}
                  onClick={handleVippsBuyNow}
                />
              )}
              {vippsError && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
                >
                  {vippsError}
                </p>
              )}
            </div>

            {highlights}

            {description}
          </div>
        </div>

        {storySections}

        {related}
      </Container>

      {/* Sticky kjøpslinje for kjøpbare produkter – SIST i sideinnholdet
          (utenfor Container) så `position: sticky` kan parkere den over
          footeren når man når bunnen. Mangler variantvalg, scroller knappen
          deg tilbake til valget i stedet for å være død. */}
      {info.type !== "membership" && !isSoldOut && (
        <StickyBuyBar
          targetRef={buyBoxRef}
          productName={info.name}
          priceInKr={priceInKr}
          media={stickyMedia}
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
              Velg {info.variantLabel ?? "alternativ"}
            </Button>
          ) : (
            /* Samme samlede pill som i kjøpsboksen (kompakt stepper), så
               antall kan justeres uten å scrolle tilbake opp — pluss kompakt
               Vipps-hurtigkasse ved siden av. */
            <div className="flex items-center gap-2">
              <div
                className={
                  allowQuantity
                    ? "flex min-w-0 flex-1 items-stretch overflow-hidden rounded-2xl border border-border bg-card sm:flex-none"
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
                    id: info.id,
                    name: info.name,
                    price: effectivePrice,
                    slug: info.slug,
                    image: cartImageUrl,
                  }}
                  variantLabel={
                    hasVariants ? (info.variantLabel ?? undefined) : undefined
                  }
                  variantValue={selectedVariant}
                  quantity={quantity}
                  maxQuantity={maxQuantity}
                  allowQuantity={allowQuantity}
                  className={allowQuantity ? "min-w-0 rounded-none" : undefined}
                />
              </div>
              <VippsButton
                compact
                loading={vippsLoading}
                onClick={handleVippsBuyNow}
                className="shrink-0"
              />
            </div>
          )}
        </StickyBuyBar>
      )}
    </>
  );
}

export { ProductDetailInteractive };

"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CheckoutConsentDialog } from "@/components/checkout-consent-dialog";
import { CheckoutConsentNotice } from "@/components/checkout-consent-notice";
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
  useId,
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
  /** Digitalt innhold som leveres umiddelbart: Vipps-knappen går via
      samtykkevinduet, og linja i kurven krever avkryssing. */
  instantDelivery: boolean;
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
  /** Media for miniatyren i den faste kjøpslinja. */
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
      <Button asChild size="lg" className="w-full rounded-full">
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
// i den faste kjøpslinja der plassen er trangere.
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

// Variantvalg (f.eks. «Signert?») som pill-knapper – ikke dropdown – så alle
// valg er synlige med én gang, og at valget MÅ tas kommer tydelig frem.
// Pillene brytes over flere linjer (ikke sidescroll), så ingen valg gjemmes.
// Brukes både i kjøpsboksen og i den faste kjøpslinja; begge speiler samme
// state, så et valg ett sted er valgt begge steder. `name` må være unik per
// forekomst, ellers blir de to radiogruppene én i nettleseren.
function VariantPicker({
  name,
  label,
  options,
  selected,
  onSelect,
  compact = false,
  hint,
}: {
  name: string;
  label: string;
  options: ProductVariantOption[];
  selected?: string;
  onSelect: (label: string | undefined) => void;
  /** Tettere variant for den faste kjøpslinja (lavere pills). */
  compact?: boolean;
  /** Forklaring over spørsmålet, f.eks. hvorfor valget må tas. Et element
      (ikke bare tekst) så kjøpslinja kan legge prisen på samme rad. */
  hint?: ReactNode;
}) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div className="min-w-0">
      {hint && (
        <div id={hintId} className="mb-1.5">
          {hint}
        </div>
      )}
      <span id={labelId} className="mb-2 block font-medium text-sm">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}
      >
        {options.map((option) => {
          const checked = selected === option.label;
          return (
            /* Skjult native radio i en pill-label: gratis tastatur-navigasjon
               og riktig semantikk, uten synlig sirkel. */
            <label
              key={option.id ?? option.label}
              className={`pressable inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border-2 font-medium text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 ${
                compact ? "h-10 px-4" : "h-11 px-5"
              } ${
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.label ?? ""}
                checked={checked}
                onChange={() => onSelect(option.label ?? undefined)}
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
  );
}

// Fast kjøpslinje: glir inn nederst så snart kjøpsboksen er ute av viewporten
// – både når den ennå ligger under folden (typisk mobil: det høye A5-bildet
// fyller skjermen ved sidelast) og når den er scrollet forbi oppover. Bunnen
// – ikke toppen – fordi headeren allerede eier toppen (fixed + vis-ved-
// scroll-opp), og bunnen er tommel-sonen på mobil. z-40 ligger bevisst under
// headerens z-50.
//
// `position: fixed` (ikke sticky): linja skal henge på viewport-bunnen hele
// veien, også over footeren. Så lenge den er synlig får <body> like mye
// padding-bottom som linja er høy, slik at bunnen av footeren fortsatt kan
// scrolles fram og ikke ligger permanent gjemt bak linja.
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
  /** Når kontrollene trenger plassen (antall-stepper, variantvalg): la dem ta
      hele bredden på mobil og gjem navn/pris (navnet er uansett åpenbart på
      produktsiden). */
  wideControls?: boolean;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        // Den faste headeren (h-16 = 64px) dekker toppen av viewporten: en
        // kjøpsboks som bare «vises» bak headeren regnes som ute av syne.
        rootMargin: "-64px 0px 0px 0px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  // Reserver plass nederst i dokumentet mens linja er synlig (se over).
  useEffect(() => {
    const el = barRef.current;
    if (!(visible && el)) {
      return;
    }
    // `--sticky-bar-height` lar andre flytende elementer (admin-blyanten)
    // løfte seg over linja uten å kjenne til denne komponenten.
    const root = document.documentElement;
    const reserve = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
      root.style.setProperty("--sticky-bar-height", `${el.offsetHeight}px`);
    };
    reserve();
    const observer = new ResizeObserver(reserve);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
      root.style.removeProperty("--sticky-bar-height");
    };
  }, [visible]);

  return (
    <div
      ref={barRef}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-border border-t bg-background/90 backdrop-blur-xl transition-transform duration-300 ease-drawer motion-reduce:transition-opacity motion-reduce:duration-200 ${
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
  const { isSoldOut, allowQuantity, instantDelivery } = info;

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
  // Kjøp er låst til variant er valgt – styrer både kjøpsboksen og kjøpslinja.
  const needsVariant = hasVariants && !selectedVariant;

  // Antall – kun for produkter som tillater det (digitale: alltid 1).
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = allowQuantity ? undefined : 1;

  // Vipps-hurtigkasse rett fra produktsiden: hopper over handlekurven og
  // sender kun dette produktet (medlemskap støttes ikke — API-et avviser).
  const [vippsLoading, setVippsLoading] = useState(false);
  const [vippsError, setVippsError] = useState<string | null>(null);
  // Vipps-knappene (kjøpsboks + sticky linje) åpner først samtykkevinduet
  // (angrerettloven § 22 n) når produktet leveres umiddelbart; betalingen
  // starter da fra Vipps-knappen i vinduet. Andre produkter går rett til Vipps.
  const [consentOpen, setConsentOpen] = useState(false);
  const handleVippsBuyNow = async () => {
    setVippsLoading(true);
    setVippsError(null);
    try {
      await startVippsBuyNow(
        {
          id: info.id,
          quantity,
          variant: selectedVariant,
        },
        instantDelivery
      );
    } catch (error) {
      console.error("Vipps checkout error:", error);
      setVippsError(error instanceof Error ? error.message : "Noe gikk galt");
      setVippsLoading(false);
    }
  };
  const onVippsClick = () => {
    setVippsError(null);
    if (instantDelivery) {
      setConsentOpen(true);
      return;
    }
    void handleVippsBuyNow();
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
              {info.type !== "membership" && !isSoldOut && hasVariants && (
                <VariantPicker
                  name={`variant-${info.id}`}
                  label={info.variantLabel ?? ""}
                  options={variantOptions}
                  selected={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              )}

              {info.type === "membership" ? (
                <MembershipApplyButton applyUrl={info.applyUrl} />
              ) : isSoldOut ? (
                <Button size="lg" className="w-full rounded-full" disabled>
                  Utsolgt
                </Button>
              ) : (
                /* Antall bor INNE i samme pill som kjøpsknappen – antall og
                 kjøp leses som én handling, og trenger ingen egen etikett. */
                <div
                  className={
                    allowQuantity
                      ? "flex items-stretch overflow-hidden rounded-full border border-border bg-card"
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
                      instantDelivery,
                    }}
                    variantLabel={
                      hasVariants ? (info.variantLabel ?? undefined) : undefined
                    }
                    variantValue={selectedVariant}
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    allowQuantity={allowQuantity}
                    disabled={needsVariant}
                    disabledLabel={`Velg ${info.variantLabel ?? "alternativ"}`}
                    className={
                      allowQuantity ? "min-w-0 rounded-none" : "rounded-full"
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
                  disabled={needsVariant}
                  onClick={onVippsClick}
                />
              )}
              {info.type !== "membership" && !isSoldOut && instantDelivery && (
                <CheckoutConsentNotice className="mt-3" />
              )}
              {vippsError && !consentOpen && (
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

      {/* Fast kjøpslinje for kjøpbare produkter. Mangler variantvalg, vises
          selve valget i linja (samme state som kjøpsboksen) – og i det valget
          er tatt bytter linja til kjøpsknapp + Vipps, uten å scrolle. */}
      {info.type !== "membership" && !isSoldOut && (
        <StickyBuyBar
          targetRef={buyBoxRef}
          productName={info.name}
          priceInKr={priceInKr}
          media={stickyMedia}
          wideControls={needsVariant || allowQuantity}
        >
          {needsVariant ? (
            <VariantPicker
              name={`variant-${info.id}-sticky`}
              label={info.variantLabel ?? ""}
              options={variantOptions}
              selected={selectedVariant}
              onSelect={setSelectedVariant}
              compact
              hint={
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-muted-foreground text-xs">
                    Velg ett alternativ før du kan kjøpe
                  </p>
                  {/* Navn/pris er gjemt på mobil i denne modusen – prisen
                      hører likevel med når man skal ta et valg. */}
                  <p className="shrink-0 font-medium text-sm tabular-nums sm:hidden">
                    {priceInKr} kr
                  </p>
                </div>
              }
            />
          ) : (
            /* Samme samlede pill som i kjøpsboksen (kompakt stepper), så
               antall kan justeres uten å scrolle tilbake opp — pluss kompakt
               Vipps-hurtigkasse ved siden av. */
            <div className="flex items-center gap-2">
              <div
                className={
                  allowQuantity
                    ? "flex min-w-0 flex-1 items-stretch overflow-hidden rounded-full border border-border bg-card sm:flex-none"
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
                    instantDelivery,
                  }}
                  variantLabel={
                    hasVariants ? (info.variantLabel ?? undefined) : undefined
                  }
                  variantValue={selectedVariant}
                  quantity={quantity}
                  maxQuantity={maxQuantity}
                  allowQuantity={allowQuantity}
                  className={
                    allowQuantity ? "min-w-0 rounded-none" : "rounded-full"
                  }
                />
              </div>
              <VippsButton
                compact
                loading={vippsLoading}
                onClick={onVippsClick}
                className="shrink-0"
              />
            </div>
          )}
        </StickyBuyBar>
      )}

      {info.type !== "membership" && !isSoldOut && instantDelivery && (
        <CheckoutConsentDialog
          open={consentOpen}
          onOpenChange={setConsentOpen}
          onConfirm={handleVippsBuyNow}
          loading={vippsLoading}
          error={vippsError}
        />
      )}
    </>
  );
}

export { ProductDetailInteractive };

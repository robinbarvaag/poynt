import { Button, cn, Heading, Lead } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowRight } from "lucide-react";

interface HeroBlockProps {
  variant?: "centered" | "left" | "split" | "fullscreen" | "gradient";
  title: string;
  subtitle?: any;
  image?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  primaryCta?: {
    text?: string;
    url?: string;
  };
  secondaryCta?: {
    text?: string;
    url?: string;
  };
  cta?: {
    text?: string;
    url?: string;
  };
}

export function HeroBlock({
  variant = "centered",
  title,
  subtitle,
  image,
  primaryCta,
  secondaryCta,
  cta,
}: HeroBlockProps) {
  const mainCta = primaryCta?.text ? primaryCta : cta;

  // Fullscreen variant - dramatic with overlay
  if (variant === "fullscreen") {
    return (
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {image && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={image.url}
              alt={image.alt || ""}
              fill
              className="object-cover scale-105"
              priority
              unoptimized={process.env.NODE_ENV === "development"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}
        <div className="relative text-center px-4 max-w-5xl mx-auto">
          <Heading
            size="display"
            className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
          >
            {title}
          </Heading>
          {subtitle && (
            <div className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto rich-text">
              <RichText data={subtitle} />
            </div>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            {mainCta?.text && mainCta?.url && (
              <Link href={mainCta.url}>
                <Button size="lg" className="group px-8">
                  {mainCta.text}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            {secondaryCta?.text && secondaryCta?.url && (
              <Link href={secondaryCta.url}>
                <Button size="lg" variant="outline" className="px-8">
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  }

  // Split variant - image on side
  if (variant === "split") {
    return (
      <section className="py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 md:order-1">
              <Heading size="h1" className="mb-6">
                {title}
              </Heading>
              {subtitle && (
                <div className="text-lg md:text-xl text-muted-foreground mb-8 rich-text">
                  <RichText data={subtitle} />
                </div>
              )}
              <div className="flex gap-4 flex-wrap">
                {mainCta?.text && mainCta?.url && (
                  <Link href={mainCta.url}>
                    <Button size="lg" className="group">
                      {mainCta.text}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
                {secondaryCta?.text && secondaryCta?.url && (
                  <Link href={secondaryCta.url}>
                    <Button size="lg" variant="outline">
                      {secondaryCta.text}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {image && (
              <div className="order-1 md:order-2 relative">
                {/* Decorative background */}
                <div className="absolute -inset-4 bg-accent/30 rounded-3xl -rotate-3 -z-10" />
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={image.url}
                    alt={image.alt || ""}
                    fill
                    className="object-cover"
                    unoptimized={process.env.NODE_ENV === "development"}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Gradient variant - colorful background
  if (variant === "gradient") {
    return (
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center">
          <Heading size="display" className="mb-6">
            {title}
          </Heading>
          {subtitle && (
            <div className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto rich-text">
              <RichText data={subtitle} />
            </div>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            {mainCta?.text && mainCta?.url && (
              <Link href={mainCta.url}>
                <Button size="lg" className="group px-8 shadow-lg">
                  {mainCta.text}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            {secondaryCta?.text && secondaryCta?.url && (
              <Link href={secondaryCta.url}>
                <Button size="lg" variant="secondary" className="px-8 shadow-lg">
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </div>

          {/* Optional image below */}
          {image && (
            <div className="mt-16 relative">
              <div className="absolute -inset-4 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border">
                <Image
                  src={image.url}
                  alt={image.alt || ""}
                  fill
                  className="object-cover"
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Centered (default) og left variants
  return (
    <section className="relative py-20 md:py-28 lg:py-36 px-4 overflow-hidden">
      {/* Subtle background pattern/image */}
      {image && variant === "centered" && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={image.url}
            alt={image.alt || ""}
            fill
            className="object-cover opacity-5"
            unoptimized={process.env.NODE_ENV === "development"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>
      )}

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div
        className={cn(
          "mx-auto max-w-6xl",
          variant === "centered" ? "text-center max-w-4xl" : "max-w-5xl"
        )}
      >
        <Heading
          size="display"
          className={cn(
            "mb-6",
            variant === "centered" && "mx-auto"
          )}
        >
          {title}
        </Heading>
        {subtitle && (
          <div
            className={cn(
              "text-lg md:text-xl text-muted-foreground mb-10 rich-text",
              variant === "centered" && "max-w-2xl mx-auto"
            )}
          >
            <RichText data={subtitle} />
          </div>
        )}
        <div
          className={cn(
            "flex gap-4 flex-wrap",
            variant === "centered" && "justify-center"
          )}
        >
          {mainCta?.text && mainCta?.url && (
            <Link href={mainCta.url}>
              <Button size="lg" className="group px-8">
                {mainCta.text}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
          {secondaryCta?.text && secondaryCta?.url && (
            <Link href={secondaryCta.url}>
              <Button size="lg" variant="outline" className="px-8">
                {secondaryCta.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

import { getMediaUrl } from "@/lib/media-url";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Button, Heading, Lead, cn } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeroBlockProps {
  variant?: "centered" | "left" | "split" | "fullscreen" | "gradient";
  title: string;
  subtitle?: any;
  tagsLabel?: string;
  tags?: { label: string; id?: string }[];
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

function HeroTags({
  label,
  tags,
  centered = false,
}: {
  label?: string;
  tags: { label: string; id?: string }[];
  centered?: boolean;
}) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("mb-8", centered && "text-center")}>
      {label && <p className="text-sm text-muted-foreground mb-3">{label}</p>}
      <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
        {tags.map((tag, index) => (
          <span
            key={tag.id || index}
            className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-accent/50 text-foreground border border-accent transition-colors hover:bg-accent/70"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroBlock({
  variant = "centered",
  title,
  subtitle,
  tagsLabel,
  tags,
  image,
  primaryCta,
  secondaryCta,
  cta,
}: HeroBlockProps) {
  const mainCta = primaryCta?.text ? primaryCta : cta;

  // Fullscreen variant - dramatic with overlay (reduced height, softer overlay)
  if (variant === "fullscreen") {
    return (
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {image && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={getMediaUrl(image.url)}
              alt={image.alt || ""}
              fill
              className="object-cover"
              priority
              unoptimized={process.env.NODE_ENV === "development"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
          </div>
        )}

        {/* Animated decorative blobs - larger and more visible */}
        <div className="absolute top-1/4 left-[8%] w-28 h-28 bg-accent/30 rounded-full -z-10 blur-xl animate-float-slow" />
        <div className="absolute top-1/3 right-[12%] w-36 h-36 bg-primary/20 rounded-full -z-10 blur-2xl animate-float-medium" />
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-accent/25 rounded-full -z-10 blur-lg animate-float-fast" />
        <div className="absolute bottom-1/4 right-[20%] w-24 h-24 bg-primary/15 rounded-full -z-10 blur-xl animate-float-slow" />

        <div className="relative text-center px-4 max-w-5xl mx-auto">
          <Heading size="display" className="mb-6">
            {title}
          </Heading>
          {subtitle && (
            <div className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto rich-text">
              <RichText data={subtitle} />
            </div>
          )}
          {tags && tags.length > 0 && (
            <HeroTags label={tagsLabel} tags={tags} centered />
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

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  }

  // Split variant - image on right side (unchanged, this is the one you like)
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
                <div className="text-lg md:text-xl text-muted-foreground mb-6 rich-text">
                  <RichText data={subtitle} />
                </div>
              )}
              {tags && tags.length > 0 && (
                <HeroTags label={tagsLabel} tags={tags} />
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
                {/* Decorative background with subtle animation */}
                <div className="absolute -inset-4 bg-accent/30 rounded-3xl -rotate-3 -z-10 animate-blob" />
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={getMediaUrl(image.url)}
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

  // Left variant - image on left, text on right (reverse of split)
  if (variant === "left") {
    return (
      <section className="py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {image && (
              <div className="relative">
                {/* Decorative background with subtle animation */}
                <div className="absolute -inset-4 bg-primary/20 rounded-3xl rotate-3 -z-10 animate-blob" />
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={getMediaUrl(image.url)}
                    alt={image.alt || ""}
                    fill
                    className="object-cover"
                    unoptimized={process.env.NODE_ENV === "development"}
                  />
                </div>
              </div>
            )}
            <div>
              <Heading size="h1" className="mb-6">
                {title}
              </Heading>
              {subtitle && (
                <div className="text-lg md:text-xl text-muted-foreground mb-6 rich-text">
                  <RichText data={subtitle} />
                </div>
              )}
              {tags && tags.length > 0 && (
                <HeroTags label={tagsLabel} tags={tags} />
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
          </div>
        </div>
      </section>
    );
  }

  // Gradient variant - clean gradient with subtle animated shapes
  if (variant === "gradient") {
    return (
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Clean gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/20 via-background to-primary/10" />

        {/* Animated decorative blobs - larger with blur effects */}
        <div className="absolute top-20 right-[15%] w-36 h-36 bg-accent/30 rounded-full -z-10 blur-xl animate-float-slow" />
        <div className="absolute bottom-32 left-[10%] w-28 h-28 bg-primary/20 rounded-full -z-10 blur-2xl animate-float-medium" />
        <div className="absolute top-1/2 right-[8%] w-20 h-20 bg-accent/25 rounded-full -z-10 blur-lg animate-float-fast" />
        <div className="absolute top-1/3 left-[5%] w-24 h-24 bg-primary/15 rounded-full -z-10 blur-xl animate-float-slow" />

        <div className="mx-auto max-w-5xl px-4 text-center">
          <Heading size="display" className="mb-6">
            {title}
          </Heading>
          {subtitle && (
            <div className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto rich-text">
              <RichText data={subtitle} />
            </div>
          )}
          {tags && tags.length > 0 && (
            <HeroTags label={tagsLabel} tags={tags} centered />
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
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-8 shadow-lg"
                >
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </div>

          {/* Optional image below with decorative frame */}
          {image && (
            <div className="mt-16 relative">
              <div className="absolute -inset-3 bg-accent/20 rounded-3xl -rotate-1 animate-blob" />
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                <Image
                  src={getMediaUrl(image.url)}
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

  // Centered (default) - clean with optional hero image below
  return (
    <section className="relative py-20 md:py-28 lg:py-36 px-4 overflow-hidden">
      {/* Animated decorative blobs */}
      <div className="absolute top-16 right-[10%] w-32 h-32 bg-accent/25 rounded-full -z-10 blur-2xl animate-float-slow" />
      <div className="absolute top-32 left-[5%] w-40 h-40 bg-primary/15 rounded-full -z-10 blur-3xl animate-float-medium" />
      <div className="absolute bottom-24 right-[15%] w-24 h-24 bg-accent/20 rounded-full -z-10 blur-xl animate-float-fast" />
      <div className="absolute bottom-32 left-[18%] w-20 h-20 bg-primary/20 rounded-full -z-10 blur-xl animate-float-slow" />

      {/* Small accent dots */}
      <div className="absolute top-1/4 right-[30%] w-3 h-3 bg-accent/40 rounded-full -z-10 animate-float-fast" />
      <div className="absolute bottom-1/4 left-[28%] w-2 h-2 bg-primary/30 rounded-full -z-10 animate-float-medium" />

      <div className="mx-auto max-w-4xl text-center">
        <Heading size="display" className="mb-6 mx-auto">
          {title}
        </Heading>
        {subtitle && (
          <div className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto rich-text">
            <RichText data={subtitle} />
          </div>
        )}
        {tags && tags.length > 0 && (
          <HeroTags label={tagsLabel} tags={tags} centered />
        )}
        <div className="flex gap-4 flex-wrap justify-center">
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

        {/* Hero image shown properly below content */}
        {image && (
          <div className="mt-16 relative">
            <div className="absolute -inset-3 bg-accent/25 rounded-3xl rotate-1 -z-10 animate-blob" />
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={getMediaUrl(image.url)}
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

import { getMediaUrl } from "@/lib/media-url";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Button, Heading, cn } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeroBlockProps {
  variant?:
    | "standard"
    | "fullscreen"
    | "centered"
    | "left"
    | "split"
    | "gradient";
  title: string;
  subtitle?: SerializedEditorState;
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
  light = false,
}: {
  label?: string;
  tags: { label: string; id?: string }[];
  centered?: boolean;
  light?: boolean;
}) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("mb-8", centered && "text-center")}>
      {label && (
        <p
          className={cn(
            "text-sm mb-3",
            light ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      )}
      <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
        {tags.map((tag, index) => (
          <span
            key={tag.id || index}
            className={cn(
              "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              light
                ? "bg-white/15 text-primary-foreground border border-white/20 hover:bg-white/25"
                : "bg-accent/50 text-foreground border border-accent hover:bg-accent/70"
            )}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroCtaButtons({
  mainCta,
  secondaryCta,
  centered = false,
  light = false,
}: {
  mainCta?: { text?: string; url?: string };
  secondaryCta?: { text?: string; url?: string };
  centered?: boolean;
  light?: boolean;
}) {
  return (
    <div className={cn("flex gap-4 flex-wrap", centered && "justify-center")}>
      {mainCta?.text && mainCta?.url && (
        <Link href={mainCta.url}>
          <Button
            size="lg"
            className={cn(
              "group rounded-full px-8",
              light && "bg-white text-primary hover:bg-white/90"
            )}
          >
            {mainCta.text}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      )}
      {secondaryCta?.text && secondaryCta?.url && (
        <Link href={secondaryCta.url}>
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "rounded-full px-8",
              light &&
                "border-white/30 text-primary-foreground hover:bg-white/10"
            )}
          >
            {secondaryCta.text}
          </Button>
        </Link>
      )}
    </div>
  );
}

export function HeroBlock({
  variant = "standard",
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
  const hasImage = Boolean(image?.url);

  // Map old variant names to new ones for backwards compatibility
  const resolvedVariant = variant === "fullscreen" ? "fullscreen" : "standard";

  // Fullscreen / Showcase variant - text on solid background, image below
  if (resolvedVariant === "fullscreen") {
    return (
      <section className="relative -mt-22 overflow-hidden bg-primary">
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.979 0.008 197) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Decorative floating shapes */}
        <div className="absolute top-20 right-[5%] w-48 h-48 bg-accent/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 left-[3%] w-64 h-64 bg-primary-foreground/8 rounded-full blur-3xl animate-float-medium" />
        <div className="absolute bottom-[30%] right-[15%] w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float-fast" />

        {/* Text content on solid background */}
        <div className="relative text-center px-6 sm:px-10 lg:px-16 pt-36 md:pt-48 pb-12 md:pb-16 max-w-5xl mx-auto">
          {tags && tags.length > 0 && (
            <HeroTags label={tagsLabel} tags={tags} centered light />
          )}
          <Heading variant="h1" color="white" customStyles="mb-6">
            {title}
          </Heading>
          {subtitle && (
            <div className="text-base md:text-xl text-primary-foreground/75 mb-10 max-w-3xl mx-auto rich-text">
              <RichText data={subtitle} />
            </div>
          )}
          <HeroCtaButtons
            mainCta={mainCta}
            secondaryCta={secondaryCta}
            centered
            light
          />
        </div>

        {/* Image showcase below text */}
        {image && (
          <div className="relative px-6 sm:px-10 lg:px-16 pb-16 md:pb-24 max-w-6xl mx-auto">
            {/* Organic blob behind image */}
            <div className="absolute -inset-x-4 inset-y-4 bg-accent/10 rounded-[2.5rem] -rotate-1 blur-sm" />
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="relative aspect-video md:aspect-2/1">
                <Image
                  src={getMediaUrl(image.url)}
                  alt={image.alt || ""}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom gradient fade to background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent" />
      </section>
    );
  }

  // Standard variant - adapts based on whether image exists
  // With image: text left + image right (split layout)
  // Without image: centered text
  if (hasImage) {
    return (
      <section className="relative -mt-22 overflow-hidden bg-secondary">
        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative shapes */}
        <div className="absolute top-16 right-[3%] w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-12 left-[2%] w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float-medium" />

        <div className="mx-auto max-w-360 px-6 sm:px-10 lg:px-16 pt-36 md:pt-44 pb-20 md:pb-28">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-2xl">
              {tags && tags.length > 0 && (
                <HeroTags label={tagsLabel} tags={tags} />
              )}
              <Heading variant="h1" customStyles="mb-6">
                {title}
              </Heading>
              {subtitle && (
                <div className="text-base md:text-lg text-muted-foreground mb-8 rich-text">
                  <RichText data={subtitle} />
                </div>
              )}
              <HeroCtaButtons mainCta={mainCta} secondaryCta={secondaryCta} />
            </div>
            {image && (
              <div className="relative">
                {/* Organic background shapes */}
                <div className="absolute -inset-4 bg-accent/20 rounded-4xl -rotate-2 -z-10 animate-blob" />
                <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-foreground/5">
                  <Image
                    src={getMediaUrl(image.url)}
                    alt={image.alt || ""}
                    fill
                    className="object-cover"
                    priority
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

  // Standard without image - centered layout
  return (
    <section className="relative -mt-22 overflow-hidden bg-linear-to-b from-primary/5 via-accent/5 to-background">
      {/* Decorative floating shapes */}
      <div className="absolute top-24 right-[10%] w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-40 left-[5%] w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute bottom-32 right-[15%] w-24 h-24 bg-accent/15 rounded-full blur-xl animate-float-fast" />
      <div className="absolute top-1/3 right-[30%] w-3 h-3 bg-accent/40 rounded-full animate-float-fast" />
      <div className="absolute bottom-1/4 left-[28%] w-2 h-2 bg-primary/30 rounded-full animate-float-medium" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-40 md:pt-48 pb-20 md:pb-28 text-center">
        {tags && tags.length > 0 && (
          <HeroTags label={tagsLabel} tags={tags} centered />
        )}
        <Heading variant="h1" customStyles="mb-6">
          {title}
        </Heading>
        {subtitle && (
          <div className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto rich-text">
            <RichText data={subtitle} />
          </div>
        )}
        <HeroCtaButtons
          mainCta={mainCta}
          secondaryCta={secondaryCta}
          centered
        />
      </div>
    </section>
  );
}

import { BlockLink } from "@/components/block-link";
import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { Hero } from "@poynt/ui";

interface HeroBlockProps {
  title: string;
  subtitle?: string;
  tagsLabel?: string;
  tags?: { label: string; id?: string }[];
  image?: MediaResource;
  imageDuotone?: boolean;
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

/**
 * Mapper Payload-blokken `hero` til Hero i @poynt/ui. `Hero` velger selv layout:
 * med bilde → split med foto klippet i organisk form; uten bilde → sentrert.
 * `-mt-22` trekker heroen opp bak den flytende headeren.
 */
export function HeroBlock({
  title,
  subtitle,
  tagsLabel,
  tags,
  image,
  imageDuotone,
  primaryCta,
  secondaryCta,
  cta,
}: HeroBlockProps) {
  const mainCta = primaryCta?.text ? primaryCta : cta;

  // Kontakt-lenker merkes med kilde=hero (uten emne — heroen har ikke ett
  // konkret tema); ?fra= festes klientside i BlockLink.
  const stamp = (url: string) =>
    url.startsWith("/kontakt") && !url.includes("kilde=")
      ? `${url}${url.includes("?") ? "&" : "?"}kilde=hero`
      : url;

  return (
    <Hero
      className="-mt-22"
      linkComponent={BlockLink}
      eyebrow={tagsLabel ?? undefined}
      title={title}
      subtitle={subtitle ?? undefined}
      primaryCta={
        mainCta?.text && mainCta?.url
          ? { text: mainCta.text, href: stamp(mainCta.url) }
          : undefined
      }
      secondaryCta={
        secondaryCta?.text && secondaryCta?.url
          ? { text: secondaryCta.text, href: stamp(secondaryCta.url) }
          : undefined
      }
      pills={tags?.map((tag) => ({ label: tag.label }))}
      // Styres per hero i admin; av som standard (ekte foto vises rent).
      duotone={imageDuotone ?? false}
      media={
        image?.url ? (
          <PayloadImage media={image} fill className="object-cover" priority />
        ) : undefined
      }
    />
  );
}

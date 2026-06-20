import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { type TestimonialItem, Testimonials } from "@poynt/ui";

type Media = MediaResource;

interface TestimonialInput {
  id?: string | null;
  quote: string;
  author: string;
  role?: string | null;
  company?: string | null;
  logo?: Media | string | null;
  avatar?: Media | string | null;
  rating?: number | null;
}

interface TestimonialsBlockProps {
  title?: string | null;
  eyebrow?: string | null;
  intro?: string | null;
  layout?: "cards" | "quote" | null;
  columns?: "2" | "3" | null;
  testimonials?: TestimonialInput[] | null;
}

function media(value: Media | string | null | undefined): Media | null {
  return value && typeof value === "object" ? value : null;
}

/**
 * Wrapper som mapper Payload-blokken `testimonials` til presentasjons-
 * komponenten `Testimonials` i @poynt/ui. Kobler `next/image` inn i
 * `avatar`/`logo`-slottene; selve oppsettet bor i designsystemet.
 */
export function TestimonialsBlock({
  title,
  eyebrow,
  intro,
  layout = "cards",
  columns,
  testimonials,
}: TestimonialsBlockProps) {
  const items: TestimonialItem[] = (testimonials ?? []).map((t, index) => {
    const logo = media(t.logo);
    const avatar = media(t.avatar);
    return {
      id: t.id ?? index,
      quote: t.quote,
      author: t.author,
      role: t.role ?? undefined,
      company: t.company ?? undefined,
      rating: t.rating ?? undefined,
      logo: logo?.url ? (
        <PayloadImage
          media={logo}
          alt={logo.alt || t.company || "Logo"}
          fill
          className="object-contain object-left"
        />
      ) : undefined,
      avatar: avatar?.url ? (
        <PayloadImage
          media={avatar}
          alt={avatar.alt || t.author}
          fill
          className="object-cover"
        />
      ) : undefined,
    };
  });

  return (
    <Testimonials
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      layout={layout === "quote" ? "quote" : "cards"}
      columns={columns ? (Number(columns) as 2 | 3) : undefined}
      testimonials={items}
    />
  );
}

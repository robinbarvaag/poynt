import { Marquee } from "@poynt/ui";

interface MarqueeBlockProps {
  items?: { text: string; id?: string | null }[] | null;
  surface?: "primary" | "saffron" | "salmon" | "mint" | "outline" | null;
  speed?: "slow" | "base" | "fast" | null;
  reverse?: boolean | null;
  tilt?: boolean | null;
}

/** Mapper Payload-blokken `marquee` til Marquee i @poynt/ui. Full bredde. */
export function MarqueeBlockComponent({
  items,
  surface,
  speed,
  reverse,
  tilt,
}: MarqueeBlockProps) {
  const words = items?.map((item) => item.text).filter(Boolean) ?? [];
  if (words.length === 0) return null;

  return (
    // Skjevstillingen løfter båndet ut av sin egen boks — litt luft over og
    // under hindrer at hjørnene spiser av seksjonene rundt.
    <div className="my-10 overflow-hidden py-3 md:my-14">
      <Marquee
        items={words}
        surface={surface ?? undefined}
        speed={speed ?? undefined}
        reverse={reverse ?? undefined}
        tilt={tilt ?? undefined}
      />
    </div>
  );
}

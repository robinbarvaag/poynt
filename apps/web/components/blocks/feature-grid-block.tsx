import { type Feature, FeatureGrid } from "@poynt/ui";

interface FeatureItem {
  title: string;
  text: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
  statValue?: string | null;
  statLabel?: string | null;
}

interface FeatureGridBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  columns?: "2" | "3" | "4" | null;
  features?: FeatureItem[] | null;
}

/**
 * Wrapper som mapper Payload-blokken `featureGrid` til presentasjons-
 * komponenten `FeatureGrid` i @poynt/ui.
 */
export function FeatureGridBlock({
  eyebrow,
  title,
  intro,
  columns,
  features,
}: FeatureGridBlockProps) {
  const mapped: Feature[] = (features ?? []).map((f) => {
    const feature: Feature = { title: f.title, text: f.text };
    if (f.linkLabel && f.linkUrl) {
      feature.link = { label: f.linkLabel, href: f.linkUrl };
    } else if (f.statValue) {
      feature.stat = { value: f.statValue, label: f.statLabel ?? "" };
    }
    return feature;
  });

  return (
    <FeatureGrid
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      columns={columns ? (Number(columns) as 2 | 3 | 4) : undefined}
      features={mapped}
    />
  );
}

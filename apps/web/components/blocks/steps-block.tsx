import { type Step, Steps } from "@poynt/ui";

interface StepItem {
  title: string;
  text: string;
}

interface StepsBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  steps?: StepItem[] | null;
}

/** Mapper Payload-blokken `steps` til Steps i @poynt/ui. */
export function StepsBlock({ eyebrow, title, intro, steps }: StepsBlockProps) {
  const mapped: Step[] = (steps ?? []).map((s) => ({
    title: s.title,
    text: s.text,
  }));
  return (
    <Steps
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      steps={mapped}
    />
  );
}

import { ChangeWheel, type WheelArea, type WheelPlanLayout } from "@poynt/ui";
import {
  type QuestionRow,
  type VekstHeaderProps,
  headerProps,
  questionList,
  text,
  vekstLink,
} from "./vekst-palette";

interface ChangeWheelBlockProps extends VekstHeaderProps {
  areas?:
    | {
        name?: string | null;
        questions?: QuestionRow[] | null;
        advice?: string | null;
        linkLabel?: string | null;
        linkUrl?: string | null;
        linkPending?: boolean | null;
        id?: string | null;
      }[]
    | null;
  aiPrompt?: string | null;
  planLayout?: ("collapsed" | "all" | "focus") | null;
  strongNote?: string | null;
}

/** Mapper Payload-blokken `changeWheel` til ChangeWheel i @poynt/ui. */
export function ChangeWheelBlock(props: ChangeWheelBlockProps) {
  const areas: WheelArea[] = (props.areas ?? [])
    .map((area) => ({
      name: text(area.name) ?? "",
      questions: questionList(area.questions),
      advice: text(area.advice),
      link: vekstLink(area.linkLabel, area.linkUrl),
      linkPending: area.linkPending ?? false,
    }))
    .filter((area) => area.name && area.questions.length > 0);

  if (areas.length < 2) return null;

  return (
    <ChangeWheel
      {...headerProps(props)}
      areas={areas}
      aiPrompt={text(props.aiPrompt)}
      planLayout={(props.planLayout ?? "collapsed") as WheelPlanLayout}
      // Tomt felt betyr «vis rådet som vanlig», så null må bli tom streng her
      // – ellers slår komponentens standardtekst inn igjen.
      strongNote={text(props.strongNote) ?? ""}
    />
  );
}

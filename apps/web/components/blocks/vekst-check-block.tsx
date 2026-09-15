import { VekstCheck, type VekstPillar } from "@poynt/ui";
import {
  type QuestionRow,
  type VekstHeaderProps,
  headerProps,
  questionList,
  text,
  vekstLink,
} from "./vekst-palette";

interface VekstCheckBlockProps extends VekstHeaderProps {
  pillars?:
    | {
        letter?: string | null;
        name?: string | null;
        questions?: QuestionRow[] | null;
        advice?: string | null;
        linkLabel?: string | null;
        linkUrl?: string | null;
        id?: string | null;
      }[]
    | null;
}

/** Mapper Payload-blokken `vekstCheck` til VekstCheck i @poynt/ui. */
export function VekstCheckBlock(props: VekstCheckBlockProps) {
  const pillars: VekstPillar[] = (props.pillars ?? [])
    .map((pillar) => ({
      letter: text(pillar.letter),
      name: text(pillar.name) ?? "",
      questions: questionList(pillar.questions),
      advice: text(pillar.advice),
      link: vekstLink(pillar.linkLabel, pillar.linkUrl),
    }))
    .filter((pillar) => pillar.name && pillar.questions.length > 0);

  if (pillars.length === 0) return null;

  return <VekstCheck {...headerProps(props)} pillars={pillars} />;
}

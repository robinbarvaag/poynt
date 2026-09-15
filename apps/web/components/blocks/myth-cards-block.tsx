import { type Myth, MythCards } from "@poynt/ui";
import {
  type VekstHeaderProps,
  headerProps,
  text,
  vekstLink,
} from "./vekst-palette";

interface MythCardsBlockProps extends VekstHeaderProps {
  myths?:
    | { lie?: string | null; truth?: string | null; id?: string | null }[]
    | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
}

/** Mapper Payload-blokken `mythCards` til MythCards i @poynt/ui. */
export function MythCardsBlock(props: MythCardsBlockProps) {
  const myths: Myth[] = (props.myths ?? [])
    .map((myth) => ({
      lie: text(myth.lie) ?? "",
      truth: text(myth.truth) ?? "",
    }))
    .filter((myth) => myth.lie && myth.truth);

  if (myths.length === 0) return null;

  return (
    <MythCards
      {...headerProps(props)}
      myths={myths}
      link={vekstLink(props.linkLabel, props.linkUrl)}
    />
  );
}

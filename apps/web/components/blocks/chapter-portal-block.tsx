import { ChapterPortal, type PortalDoor } from "@poynt/ui";
import { type VekstHeaderProps, headerProps, text } from "./vekst-palette";

interface ChapterPortalBlockProps extends VekstHeaderProps {
  doors?:
    | {
        letter?: string | null;
        title?: string | null;
        text?: string | null;
        linkLabel?: string | null;
        href?: string | null;
        id?: string | null;
      }[]
    | null;
}

/** Mapper Payload-blokken `chapterPortal` til ChapterPortal i @poynt/ui. */
export function ChapterPortalBlock(props: ChapterPortalBlockProps) {
  const doors: PortalDoor[] = (props.doors ?? [])
    .filter((door) => text(door.title))
    .map((door) => ({
      letter: text(door.letter),
      title: text(door.title) as string,
      text: text(door.text),
      href: text(door.href),
      linkLabel: text(door.linkLabel),
    }));

  if (doors.length === 0) return null;

  return <ChapterPortal {...headerProps(props)} doors={doors} />;
}

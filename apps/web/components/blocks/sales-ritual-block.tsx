import {
  WEEKDAYS,
  endTime,
  isTime,
  isWeekday,
  weeklyEventHref,
} from "@/lib/vekst/ics";
import { SalesRitual } from "@poynt/ui";
import { type VekstHeaderProps, headerProps, text } from "./vekst-palette";

interface SalesRitualBlockProps extends VekstHeaderProps {
  ritualName?: string | null;
  weekday?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
  quote?: string | null;
  checklist?: { item?: string | null; id?: string | null }[] | null;
  calendarDescription?: string | null;
}

/** Mapper Payload-blokken `salesRitual` til SalesRitual i @poynt/ui. */
export function SalesRitualBlock(props: SalesRitualBlockProps) {
  const ritualName = text(props.ritualName);
  const weekday = isWeekday(props.weekday) ? props.weekday : "WE";
  const startTime = isTime(props.startTime) ? props.startTime : "09:00";
  const duration = props.durationMinutes ?? 240;
  const checklist = (props.checklist ?? [])
    .map((row) => text(row.item))
    .filter((item): item is string => Boolean(item));

  if (!ritualName || checklist.length === 0) return null;

  const validDuration =
    Number.isInteger(duration) && duration >= 15 && duration <= 720;

  return (
    <SalesRitual
      {...headerProps(props)}
      ritualName={ritualName}
      weekdayLabel={WEEKDAYS[weekday].label}
      weekdayShort={WEEKDAYS[weekday].short}
      startTime={startTime}
      endTime={endTime(startTime, duration)}
      checklist={checklist}
      quote={text(props.quote)}
      calendarHref={
        validDuration
          ? weeklyEventHref({
              title: ritualName,
              description: text(props.calendarDescription),
              weekday,
              startTime,
              durationMinutes: duration,
            })
          : undefined
      }
    />
  );
}

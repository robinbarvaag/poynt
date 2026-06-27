import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc } from "@poynt/planner-db";
import {
  plannerContentSuggestion,
  plannerRadarRun,
} from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { RadarBoard } from "../../components/radar/radar-board";

async function getSuggestions() {
  return db
    .select()
    .from(plannerContentSuggestion)
    .orderBy(desc(plannerContentSuggestion.priority))
    .limit(200);
}

async function getRuns() {
  return db
    .select()
    .from(plannerRadarRun)
    .orderBy(desc(plannerRadarRun.startedAt))
    .limit(5);
}

export type RadarSuggestionItem = Awaited<
  ReturnType<typeof getSuggestions>
>[number];
export type RadarRunItem = Awaited<ReturnType<typeof getRuns>>[number];

export const RadarListView = async (props: AdminViewServerProps) => {
  const [suggestions, runs] = await Promise.all([getSuggestions(), getRuns()]);
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Innholdsradar" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Innholdsradar</h1>
          </div>
          <p
            style={{
              marginBottom: "0.75rem",
              maxWidth: "60ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            En redaksjonell assistent som leser innholdsbiblioteket og
            medlemmenes verktøybruk, regner ut signaler, og foreslår hva som bør
            lages, oppdateres, promoteres eller gjenbrukes. Prioriteten settes
            av signalet bak forslaget — ikke av AI-en.
          </p>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "60ch",
              fontSize: "0.88em",
              color: "var(--theme-elevation-500)",
            }}
          >
            Slik leser du hvert kort: <strong>tittelen</strong> er handlingen
            (hva som bør lages), <strong>begrunnelsen</strong> forklarer for
            hvem og hvorfor, og <strong>«Hvorfor»</strong> nederst viser det rå
            faktumet (signalet) forslaget bygger på.
          </p>
          <RadarBoard suggestions={suggestions} runs={runs} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

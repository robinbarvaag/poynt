import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc } from "@poynt/planner-db";
import {
  plannerInspirationItem,
  plannerInspirationSource,
} from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { getItemCountBySource } from "../../../lib/radar/inspiration";
import { InspirationSourcesTable } from "../../components/inspiration/sources-table";

async function getSources() {
  return db
    .select()
    .from(plannerInspirationSource)
    .orderBy(desc(plannerInspirationSource.createdAt));
}

async function getRecentItems() {
  return db
    .select({
      id: plannerInspirationItem.id,
      title: plannerInspirationItem.title,
      url: plannerInspirationItem.url,
      summary: plannerInspirationItem.summary,
      topics: plannerInspirationItem.topics,
      createdAt: plannerInspirationItem.createdAt,
    })
    .from(plannerInspirationItem)
    .orderBy(desc(plannerInspirationItem.createdAt))
    .limit(12);
}

export type InspirationSourceItem = Awaited<
  ReturnType<typeof getSources>
>[number];
export type InspirationRecentItem = Awaited<
  ReturnType<typeof getRecentItems>
>[number];

export const InspirationListView = async (props: AdminViewServerProps) => {
  const [sources, items, counts] = await Promise.all([
    getSources(),
    getRecentItems(),
    getItemCountBySource(),
  ]);
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Inspirasjonskilder" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Inspirasjonskilder</h1>
          </div>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "62ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            Offentlige RSS-feeds og nettsider radaren henter inspirasjon fra.
            Innholdet destilleres til temaer, og temaer On Poynt ikke dekker
            ennå dukker opp som forslag i Innholdsradaren. «Flinke folk»
            registreres via deres offentlige blogg/nyhetsbrev — vi kan ikke
            hente fra LinkedIn eller X (innlogging kreves).
          </p>
          <InspirationSourcesTable
            sources={sources}
            counts={counts}
            recentItems={items}
          />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

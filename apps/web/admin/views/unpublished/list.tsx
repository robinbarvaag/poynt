import { getUnpublishedOverview } from "@/lib/unpublished-overview";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import type { AdminViewServerProps } from "payload";
import { UnpublishedBoard } from "../../components/unpublished/unpublished-board";

/**
 * «Klar til publisering» (/admin/upublisert): alt innhold der siste versjon er
 * et utkast. Autosave gjør at endringer lagres uten å publiseres, så dette er
 * stedet å fange opp sider som ligger igjen halvferdige.
 */
export const UnpublishedListView = async (props: AdminViewServerProps) => {
  const rows = await getUnpublishedOverview(props.payload);
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Klar til publisering" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Klar til publisering</h1>
          </div>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "60ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            Alt innhold som har endringer som ennå ikke er ute på nettsiden —
            enten aldri publisert, eller publisert og endret etterpå. Publiser
            én rad med <strong>P</strong>, hele lista med{" "}
            <strong>Shift+P</strong>, og flytt markøren med piltastene.
          </p>
          <UnpublishedBoard rows={rows} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

import { getQualityOverview } from "@/lib/quality-overview";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import type { AdminViewServerProps } from "payload";
import { QualityBoard } from "../../components/quality/quality-board";

/**
 * Kvalitetsoversikt (/admin/kvalitet): samler AI-kvalitetsvurderingen for alt
 * innhold på ett brett — hva som er vurdert, hva som er endret siden sist, og
 * en «kjør alle»-knapp som bare vurderer det som faktisk trenger det.
 */
export const QualityListView = async (props: AdminViewServerProps) => {
  const rows = await getQualityOverview(props.payload);
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Kvalitetsoversikt" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Kvalitetsoversikt</h1>
          </div>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "60ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            AI-en leser gjennom innholdet og gir hver side en score med konkrete
            forslag. Her ser du alt samlet: hva som aldri er vurdert, hva som er
            endret siden forrige vurdering, og hva som er oppdatert. «Vurder
            alle»-knappen hopper over det som allerede er ferskt — den bruker
            litt tid per side, så la fanen stå åpen mens den jobber.
          </p>
          <QualityBoard rows={rows} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

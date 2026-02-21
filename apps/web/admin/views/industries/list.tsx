import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { asc } from "@poynt/planner-db";
import { db } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { IndustriesTable } from "../../components/industries/industries-table";

async function getIndustries() {
  const industries = await db
    .select()
    .from(plannerIndustry)
    .orderBy(asc(plannerIndustry.sortOrder), asc(plannerIndustry.name));

  return industries;
}

export type IndustryListItem = Awaited<
  ReturnType<typeof getIndustries>
>[number];

export const IndustriesListView = async (props: AdminViewServerProps) => {
  const industries = await getIndustries();
  const visibleEntities = getVisibleEntities({
    req: props.initPageResult.req,
  });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Bransjar" }]} />
      <Gutter>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Bransjar</h1>
          <span
            style={{
              fontSize: "var(--font-body-size)",
              color: "var(--theme-elevation-500)",
            }}
          >
            {industries.length} bransjar totalt
          </span>
        </div>
        <p
          style={{
            marginBottom: "2rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Bransjar som brukast i alle AI-verktøy. Aktive bransjar er synlege for
          brukarane.
        </p>
        <IndustriesTable industries={industries} />
      </Gutter>
    </DefaultTemplate>
  );
};

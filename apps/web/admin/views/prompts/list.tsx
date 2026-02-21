import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { asc, db } from "@poynt/planner-db";
import { plannerPromptTemplate } from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { PromptsTable } from "../../components/prompts/prompts-table";

async function getPromptTemplates() {
  const templates = await db
    .select()
    .from(plannerPromptTemplate)
    .orderBy(
      asc(plannerPromptTemplate.toolId),
      asc(plannerPromptTemplate.name)
    );

  return templates;
}

export type PromptTemplateListItem = Awaited<
  ReturnType<typeof getPromptTemplates>
>[number];

export const PromptsListView = async (props: AdminViewServerProps) => {
  const templates = await getPromptTemplates();
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
      <SetStepNav nav={[{ label: "Prompt-malar" }]} />
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
          <h1 style={{ margin: 0 }}>Prompt-malar</h1>
          <span
            style={{
              fontSize: "var(--font-body-size)",
              color: "var(--theme-elevation-500)",
            }}
          >
            {templates.length} malar
          </span>
        </div>
        <p
          style={{
            marginBottom: "2rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Rediger system-prompts for AI-verktøya. Endringar trer i kraft
          umiddelbart for nye køyringar.
        </p>
        <PromptsTable templates={templates} />
      </Gutter>
    </DefaultTemplate>
  );
};

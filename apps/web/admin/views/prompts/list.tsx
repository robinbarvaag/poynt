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
      <SetStepNav nav={[{ label: "Prompt-maler" }]} />
      <div style={{ width: "100%" }}>
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
            <h1 style={{ margin: 0 }}>Prompt-maler</h1>
            <span
              style={{
                fontSize: "var(--font-body-size)",
                color: "var(--theme-elevation-500)",
              }}
            >
              {templates.length} maler totalt
            </span>
          </div>
          <p
            style={{
              marginBottom: "1rem",
              color: "var(--theme-elevation-500)",
            }}
          >
            Her styrer du system-promptene som brukes av AI-verktøyene i On
            Poynt. Endringer trer i kraft umiddelbart.
          </p>
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: "var(--theme-elevation-50)",
              borderRadius: "var(--style-radius-s)",
              border: "1px solid var(--theme-elevation-150)",
              fontSize: "0.9em",
              color: "var(--theme-elevation-600)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.5rem" }}>
              Slik fungerer prompt-maler:
            </strong>
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              <li>
                <strong>Verktøy</strong> — Hvilket AI-verktøy malen tilhører
                (f.eks. Kanalveileder, Markedsplan).
              </li>
              <li>
                <strong>Navn</strong> — Internt navn for å skille mellom maler
                til samme verktøy.
              </li>
              <li>
                <strong>Prompt-tekst</strong> — Selve instruksjonen som sendes
                til AI. Bruk{" "}
                <code
                  style={{
                    background: "var(--theme-elevation-100)",
                    padding: "0.1rem 0.3rem",
                    borderRadius: "3px",
                  }}
                >
                  {"{{variabel}}"}
                </code>{" "}
                for dynamiske verdier (f.eks. bransjnavn, brukerinput).
              </li>
              <li>
                <strong>Status</strong> — Kun aktive maler brukes av verktøyene.
                Deaktiver for å teste uten å slette.
              </li>
            </ul>
          </div>
          <PromptsTable templates={templates} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

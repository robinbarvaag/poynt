import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc, sql } from "@poynt/planner-db";
import { plannerMembershipApplication } from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { ApplicationTable } from "../../components/applications/application-table";

async function getApplications() {
  const applications = await db
    .select({
      id: plannerMembershipApplication.id,
      status: plannerMembershipApplication.status,
      fullName: plannerMembershipApplication.fullName,
      email: plannerMembershipApplication.email,
      companyName: plannerMembershipApplication.companyName,
      createdAt: plannerMembershipApplication.createdAt,
    })
    .from(plannerMembershipApplication)
    .orderBy(
      // Ubehandlede søknader øverst, deretter nyeste først.
      desc(sql`(${plannerMembershipApplication.status} = 'pending')`),
      desc(plannerMembershipApplication.createdAt)
    );

  return applications.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));
}

export type ApplicationListItem = Awaited<
  ReturnType<typeof getApplications>
>[number];

export const MembershipApplicationsListView = async (
  props: AdminViewServerProps
) => {
  const applications = await getApplications();
  const pendingCount = applications.filter(
    (a) => a.status === "pending"
  ).length;
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
      <SetStepNav nav={[{ label: "Søknader" }]} />
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
            <h1 style={{ margin: 0 }}>Søknader</h1>
            <span
              style={{
                fontSize: "var(--font-body-size)",
                color: "var(--theme-elevation-500)",
              }}
            >
              {pendingCount} til behandling · {applications.length} totalt
            </span>
          </div>
          <ApplicationTable applications={applications} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

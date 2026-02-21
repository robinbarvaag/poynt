import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc, eq, sql } from "@poynt/planner-db";
import {
  plannerSession,
  plannerSubscription,
  plannerUser,
} from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { MemberTable } from "../../components/members/member-table";

async function getMembers() {
  const members = await db
    .select({
      id: plannerUser.id,
      name: plannerUser.name,
      email: plannerUser.email,
      image: plannerUser.image,
      onboardingCompleted: plannerUser.onboardingCompleted,
      createdAt: plannerUser.createdAt,
      tier: plannerSubscription.tier,
      status: plannerSubscription.status,
      stripeCustomerId: plannerSubscription.stripeCustomerId,
      currentPeriodEnd: plannerSubscription.currentPeriodEnd,
      cancelAtPeriodEnd: plannerSubscription.cancelAtPeriodEnd,
    })
    .from(plannerUser)
    .leftJoin(
      plannerSubscription,
      eq(plannerUser.id, plannerSubscription.userId)
    )
    .orderBy(desc(plannerUser.createdAt));

  // Get last session per user
  const sessions = await db
    .select({
      userId: plannerSession.userId,
      lastLogin: sql<string>`max(${plannerSession.createdAt})`.as("last_login"),
    })
    .from(plannerSession)
    .groupBy(plannerSession.userId);

  const sessionMap = new Map(sessions.map((s) => [s.userId, s.lastLogin]));

  return members.map((m) => ({
    ...m,
    tier: m.tier ?? "none",
    status: m.status ?? "inactive",
    createdAt: m.createdAt.toISOString(),
    currentPeriodEnd: m.currentPeriodEnd?.toISOString() ?? null,
    lastLogin: sessionMap.get(m.id) ?? null,
  }));
}

export type MemberListItem = Awaited<ReturnType<typeof getMembers>>[number];

export const MembersListView = async (props: AdminViewServerProps) => {
  const members = await getMembers();
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
      <SetStepNav nav={[{ label: "Medlemmer" }]} />
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
            <h1 style={{ margin: 0 }}>Medlemmer</h1>
            <span
              style={{
                fontSize: "var(--font-body-size)",
                color: "var(--theme-elevation-500)",
              }}
            >
              {members.length} registrerte medlemmer
            </span>
          </div>
          <MemberTable members={members} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};

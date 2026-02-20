import type React from "react";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc, eq } from "@poynt/planner-db";
import {
  plannerSession,
  plannerSubscription,
  plannerUser,
} from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import { MemberActions } from "../../components/members/member-actions";
import { MemberDetailCard } from "../../components/members/member-detail-card";

async function getMember(userId: string) {
  const [user] = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.id, userId))
    .limit(1);

  if (!user) return null;

  const [subscription] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  const recentSessions = await db
    .select({
      createdAt: plannerSession.createdAt,
      ipAddress: plannerSession.ipAddress,
      userAgent: plannerSession.userAgent,
    })
    .from(plannerSession)
    .where(eq(plannerSession.userId, userId))
    .orderBy(desc(plannerSession.createdAt))
    .limit(5);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt.toISOString(),
    },
    subscription: subscription
      ? {
          tier: subscription.tier,
          status: subscription.status,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodStart:
            subscription.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd:
            subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          createdAt: subscription.createdAt.toISOString(),
        }
      : null,
    recentSessions: recentSessions.map((s) => ({
      createdAt: s.createdAt.toISOString(),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    })),
  };
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMember>>>;

export const MemberDetailView = async (props: AdminViewServerProps) => {
  // Extract userId from route params
  // For path "/medlemmer/:id", params will have id
  const params = props.params as Record<string, string | string[] | undefined>;
  const segments = params?.segments;
  // segments from catch-all: ["medlemmer", "<id>"]
  const userId =
    typeof segments === "string"
      ? segments
      : Array.isArray(segments)
        ? segments[1]
        : (params?.id as string | undefined);

  const visibleEntities = getVisibleEntities({
    req: props.initPageResult.req,
  });

  const template = (children: React.ReactNode) => (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      {children}
    </DefaultTemplate>
  );

  if (!userId) {
    return template(
      <Gutter>
        <SetStepNav
          nav={[
            { label: "Medlemmer", url: "/admin/medlemmer" },
            { label: "Feil" },
          ]}
        />
        <p style={{ marginTop: "2rem" }}>Ugyldig medlem-ID</p>
      </Gutter>,
    );
  }

  const member = await getMember(userId);

  if (!member) {
    return template(
      <Gutter>
        <SetStepNav
          nav={[
            { label: "Medlemmer", url: "/admin/medlemmer" },
            { label: "Ikkje funne" },
          ]}
        />
        <p style={{ marginTop: "2rem" }}>Fann ikkje medlemmet</p>
      </Gutter>,
    );
  }

  return template(
    <>
      <SetStepNav
        nav={[
          { label: "Medlemmer", url: "/admin/medlemmer" },
          { label: member.user.name },
        ]}
      />
      <Gutter>
        <div style={{ marginTop: "1.5rem" }}>
          <MemberDetailCard
            user={member.user}
            subscription={member.subscription}
            recentSessions={member.recentSessions}
          />
          <MemberActions
            userId={member.user.id}
            currentTier={member.subscription?.tier ?? "none"}
            currentStatus={member.subscription?.status ?? "inactive"}
            hasSubscription={!!member.subscription}
          />
        </div>
      </Gutter>
    </>,
  );
};

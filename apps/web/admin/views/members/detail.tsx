import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, desc, eq } from "@poynt/on-poynt-db";
import {
  onPoyntSession,
  onPoyntSubscription,
  onPoyntUser,
} from "@poynt/on-poynt-db/schema";
import type { AdminViewServerProps } from "payload";
import type React from "react";
import { MemberActions } from "../../components/members/member-actions";
import { MemberDetailCard } from "../../components/members/member-detail-card";

async function getMember(userId: string) {
  const [user] = await db
    .select()
    .from(onPoyntUser)
    .where(eq(onPoyntUser.id, userId))
    .limit(1);

  if (!user) return null;

  const [subscription] = await db
    .select()
    .from(onPoyntSubscription)
    .where(eq(onPoyntSubscription.userId, userId))
    .limit(1);

  const recentSessions = await db
    .select({
      createdAt: onPoyntSession.createdAt,
      ipAddress: onPoyntSession.ipAddress,
      userAgent: onPoyntSession.userAgent,
    })
    .from(onPoyntSession)
    .where(eq(onPoyntSession.userId, userId))
    .orderBy(desc(onPoyntSession.createdAt))
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
      <div style={{ width: "100%" }}>
        <SetStepNav
          nav={[
            { label: "Medlemmer", url: "/admin/medlemmer" },
            { label: "Feil" },
          ]}
        />
        <Gutter>
          <p style={{ marginTop: "2rem" }}>Ugyldig medlem-ID</p>
        </Gutter>
      </div>
    );
  }

  const member = await getMember(userId);

  if (!member) {
    return template(
      <div style={{ width: "100%" }}>
        <SetStepNav
          nav={[
            { label: "Medlemmer", url: "/admin/medlemmer" },
            { label: "Ikke funnet" },
          ]}
        />
        <Gutter>
          <p style={{ marginTop: "2rem" }}>Fant ikke medlemmet</p>
        </Gutter>
      </div>
    );
  }

  return template(
    <div style={{ width: "100%" }}>
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
            email={member.user.email}
            name={member.user.name}
            currentTier={member.subscription?.tier ?? "none"}
            currentStatus={member.subscription?.status ?? "inactive"}
            hasSubscription={!!member.subscription}
          />
        </div>
      </Gutter>
    </div>
  );
};

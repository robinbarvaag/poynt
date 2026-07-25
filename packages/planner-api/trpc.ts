import { db } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";
import { hasAiTools } from "@poynt/planner-validators";
import { TRPCError, initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getAdminInfo } from "./lib/admin-access";

/**
 * Context type for tRPC procedures
 */
export interface Context {
  userId: string | null;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Protected procedure - requires authenticated user
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å gjøre dette",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Member procedure - requires an active membership (paid subscription in good standing).
 *
 * De kanoniske reglene for tilgang bor i `apps/web/lib/membership/has-active-access.ts`
 * (`hasActiveAccess`) og MÅ holdes i sync med implementasjonen her, siden
 * `packages/planner-api` ikke kan importere fra `apps/web`:
 * - ingen abonnement, eller tier "none" -> ingen tilgang
 * - status "active" -> tilgang
 * - status "canceled" og currentPeriodEnd i fremtiden -> tilgang (innenfor betalt periode)
 * - status "past_due" -> tilgang (grace period)
 * - alt annet -> ingen tilgang
 */
export const memberProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å gjøre dette",
    });
  }

  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, ctx.userId))
    .limit(1);

  if (!sub || sub.tier === "none") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Krever aktivt medlemskap",
    });
  }

  const hasActiveAccess =
    sub.status === "active" ||
    (sub.status === "canceled" &&
      sub.currentPeriodEnd !== null &&
      sub.currentPeriodEnd > new Date()) ||
    sub.status === "past_due";

  if (!hasActiveAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Krever aktivt medlemskap",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * AI protected procedure - requires community_ai tier with active access.
 * Allows: active status, canceled-but-within-period, past_due (grace period).
 */
export const aiProtectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å gjøre dette",
    });
  }

  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, ctx.userId))
    .limit(1);

  if (!sub || !hasAiTools(sub.tier)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "community_ai",
    });
  }

  const allowedStatuses = ["active", "canceled", "past_due"] as const;
  const isAllowedStatus = (allowedStatuses as readonly string[]).includes(
    sub.status
  );

  // For canceled: only allow if still within the paid period
  if (sub.status === "canceled") {
    const withinPeriod =
      sub.currentPeriodEnd && sub.currentPeriodEnd > new Date();
    if (!withinPeriod) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Abonnementet ditt er avsluttet",
      });
    }
  } else if (!isAllowedStatus) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilgang til AI-verktøy",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Admin procedure - requires admin or super_admin role
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å gjøre dette",
    });
  }

  // Tilgang på rolle ELLER e-post-allowlist (sentralisert).
  const info = await getAdminInfo(ctx.userId);
  if (!info.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilgang til denne ressursen",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      userRole: info.role,
    },
  });
});

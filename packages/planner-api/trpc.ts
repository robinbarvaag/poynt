import { db } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { TRPCError, initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";

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
 * Admin procedure - requires admin or super_admin role
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å gjøre dette",
    });
  }

  // Fetch user with role
  const [dbUser] = await db
    .select({ role: plannerUser.role })
    .from(plannerUser)
    .where(eq(plannerUser.id, ctx.userId))
    .limit(1);

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilgang til denne ressursen",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      userRole: dbUser.role,
    },
  });
});

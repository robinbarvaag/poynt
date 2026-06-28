import { db } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { eq } from "drizzle-orm";
import { getAdminInfo } from "../lib/admin-access";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const adminRouter = router({
  /**
   * Check if current user has admin access (rolle ELLER e-post-allowlist).
   */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    return getAdminInfo(ctx.userId);
  }),

  /**
   * Get current user info for admin
   */
  getCurrentUser: adminProcedure.query(async ({ ctx }) => {
    const [dbUser] = await db
      .select()
      .from(plannerUser)
      .where(eq(plannerUser.id, ctx.userId))
      .limit(1);

    return dbUser;
  }),
});

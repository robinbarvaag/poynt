import { db } from "@poynt/on-poynt-db";
import { onPoyntUser } from "@poynt/on-poynt-db/schema";
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
      .from(onPoyntUser)
      .where(eq(onPoyntUser.id, ctx.userId))
      .limit(1);

    return dbUser;
  }),
});

import { db } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { eq } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const adminRouter = router({
  /**
   * Check if current user has admin access
   */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const [dbUser] = await db
      .select({ role: plannerUser.role })
      .from(plannerUser)
      .where(eq(plannerUser.id, ctx.userId))
      .limit(1);

    const isAdmin = dbUser?.role === "admin" || dbUser?.role === "super_admin";
    const isSuperAdmin = dbUser?.role === "super_admin";

    return {
      isAdmin,
      isSuperAdmin,
      role: dbUser?.role ?? "user",
    };
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

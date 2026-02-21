import { db } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const membershipRouter = router({
  getTier: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await db
      .select({
        tier: plannerSubscription.tier,
        status: plannerSubscription.status,
      })
      .from(plannerSubscription)
      .where(eq(plannerSubscription.userId, ctx.userId))
      .limit(1);

    return {
      tier: sub?.tier ?? "none",
      status: sub?.status ?? "inactive",
    };
  }),
});

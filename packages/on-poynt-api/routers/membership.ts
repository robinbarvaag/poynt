import { db } from "@poynt/on-poynt-db";
import { onPoyntSubscription } from "@poynt/on-poynt-db/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const membershipRouter = router({
  getTier: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await db
      .select({
        tier: onPoyntSubscription.tier,
        status: onPoyntSubscription.status,
      })
      .from(onPoyntSubscription)
      .where(eq(onPoyntSubscription.userId, ctx.userId))
      .limit(1);

    return {
      tier: sub?.tier ?? "none",
      status: sub?.status ?? "inactive",
    };
  }),
});

import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";
import { declineFeedbackRouter } from "./routers/decline-feedback";
import { industryRouter } from "./routers/industry";
import { marketingPlanProgressRouter } from "./routers/marketing-plan-progress";
import { membershipRouter } from "./routers/membership";
import { toolResultRouter } from "./routers/tool-result";
import { workspaceRouter } from "./routers/workspace";
import { workspaceProfileRouter } from "./routers/workspace-profile";
import { router } from "./trpc";

/**
 * This is the primary router for the planner API.
 *
 * All routers added in ./routers should be manually added here.
 */
export const appRouter = router({
  ai: aiRouter,
  workspace: workspaceRouter,
  industry: industryRouter,
  admin: adminRouter,
  workspaceProfile: workspaceProfileRouter,
  toolResult: toolResultRouter,
  marketingPlanProgress: marketingPlanProgressRouter,
  membership: membershipRouter,
  declineFeedback: declineFeedbackRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

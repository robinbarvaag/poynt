import { router } from "./trpc";
import { aiRouter } from "./routers/ai";
import { workspaceRouter } from "./routers/workspace";
import { industryRouter } from "./routers/industry";
import { adminRouter } from "./routers/admin";
import { workspaceProfileRouter } from "./routers/workspace-profile";
import { toolResultRouter } from "./routers/tool-result";
import { marketingPlanProgressRouter } from "./routers/marketing-plan-progress";
import { declineFeedbackRouter } from "./routers/decline-feedback";

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
  declineFeedback: declineFeedbackRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

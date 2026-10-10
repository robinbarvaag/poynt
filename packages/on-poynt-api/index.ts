// Root router and type
export { appRouter, type AppRouter } from "./root";

// tRPC utilities
export { router, publicProcedure, createCallerFactory } from "./trpc";

// Re-export routers for direct access if needed
export { aiRouter } from "./routers/ai";

// Prompt-mal-hjelpere og standardmaler (seedes inn i admin)
export {
  interpolate,
  resolveSystemPrompt,
  defaultPromptTemplates,
  type DefaultPromptTemplate,
} from "./lib/prompt-template";

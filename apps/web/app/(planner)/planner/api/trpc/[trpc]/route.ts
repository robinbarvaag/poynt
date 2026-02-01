import { appRouter } from "@poynt/planner-api";
import { auth } from "@poynt/planner-auth/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { headers } from "next/headers";

const handler = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return fetchRequestHandler({
    endpoint: "/planner/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({
      userId: session?.user?.id ?? null,
    }),
  });
};

export { handler as GET, handler as POST };

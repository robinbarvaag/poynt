import { appRouter } from "@poynt/on-poynt-api";
import { auth } from "@poynt/on-poynt-auth/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { headers } from "next/headers";

const handler = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return fetchRequestHandler({
    endpoint: "/on-poynt/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({
      userId: session?.user?.id ?? null,
    }),
  });
};

export { handler as GET, handler as POST };

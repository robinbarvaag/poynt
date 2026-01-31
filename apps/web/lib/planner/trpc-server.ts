import { appRouter, createCallerFactory } from "@poynt/planner-api";
import { auth } from "@poynt/planner-auth/server";
import { headers } from "next/headers";

/**
 * Server-side tRPC caller for use in Server Components and Server Actions
 *
 * @example
 * ```tsx
 * // In a Server Component (page.tsx)
 * export default async function Page() {
 *   const trpc = await createServerCaller();
 *   const data = await trpc.someRouter.list();
 *   return <ClientComponent initialData={data} />;
 * }
 * ```
 */
export async function createServerCaller() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    userId: session?.user?.id ?? null,
  });
}

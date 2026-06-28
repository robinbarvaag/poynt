import "server-only";
import { auth } from "@poynt/planner-auth/server";
import { db, eq } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { headers } from "next/headers";

/**
 * Tilgangsgate for Modell-laben (`/on-poynt/lab`). Intern admin-verktøy, så vi
 * slipper inn enten på DB-rolle (`admin`/`super_admin`) ELLER en e-post-
 * allowlist. Allowlisten gjør at eieren kommer inn selv om rollen ikke er satt
 * i DB ennå. Overstyr/utvid med env `PLAYGROUND_ADMIN_EMAILS` (komma-separert).
 */
const ADMIN_EMAILS = (
  process.env.PLAYGROUND_ADMIN_EMAILS ?? "robinbarvaag@gmail.com"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export type PlaygroundSession = { userId: string; email: string };

/**
 * Returnerer admin-sesjonen hvis brukeren har tilgang til laben, ellers null.
 */
export async function getPlaygroundSession(): Promise<PlaygroundSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return null;

  const email = (user.email ?? "").toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) {
    return { userId: user.id, email };
  }

  const [row] = await db
    .select({ role: plannerUser.role })
    .from(plannerUser)
    .where(eq(plannerUser.id, user.id))
    .limit(1);
  if (row?.role === "admin" || row?.role === "super_admin") {
    return { userId: user.id, email };
  }

  return null;
}

import { db } from "@poynt/on-poynt-db";
import { onPoyntUser } from "@poynt/on-poynt-db/schema";
import { eq } from "drizzle-orm";

/**
 * Sentral admin-sjekk: gir tilgang på DB-rolle (`admin`/`super_admin`) ELLER en
 * e-post-allowlist. Allowlisten lar eieren komme inn før rollen er satt i DB.
 * Utvid med env `ADMIN_EMAILS` (komma-separert). Brukes av tRPC-`adminProcedure`
 * og `admin.checkAccess`, så hele admin-flaten (inkl. nav-lenker) er konsistent.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "robinbarvaag@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export type AdminInfo = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string;
};

export async function getAdminInfo(userId: string): Promise<AdminInfo> {
  const [row] = await db
    .select({ role: onPoyntUser.role, email: onPoyntUser.email })
    .from(onPoyntUser)
    .where(eq(onPoyntUser.id, userId))
    .limit(1);

  const role = row?.role ?? "user";
  const byRole = role === "admin" || role === "super_admin";
  const byEmail =
    !!row?.email && ADMIN_EMAILS.includes(row.email.toLowerCase());

  return {
    isAdmin: byRole || byEmail,
    isSuperAdmin: role === "super_admin",
    role,
  };
}

import { db, eq, or, sql } from "@poynt/on-poynt-db";
import { onPoyntUser } from "@poynt/on-poynt-db/schema";
import { canonicalizeEmail } from "@poynt/utils/email-normalize";

/**
 * Finn On Poynt-brukeren som eier en e-postadresse.
 *
 * Slår opp på `canonicalEmail` først, men faller tilbake på selve
 * e-postkolonnen: kontoer Better Auth opprettet selv (før registrering ble
 * stengt) har tom `canonicalEmail`, og et rent kanonisk oppslag fant dem ikke —
 * godkjenningen prøvde da å opprette en ny bruker med samme e-post og traff
 * unik-kravet. Finner vi en slik rad, fyller vi inn `canonicalEmail` i samme
 * slengen så neste oppslag treffer direkte.
 */
export async function findOnPoyntUserByEmail(email: string) {
  const canonical = canonicalizeEmail(email);
  const lowered = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(onPoyntUser)
    .where(
      or(
        eq(onPoyntUser.canonicalEmail, canonical),
        eq(sql`lower(${onPoyntUser.email})`, lowered)
      )
    )
    .orderBy(
      // Foretrekk kanonisk treff hvis begge finnes.
      sql`case when ${onPoyntUser.canonicalEmail} = ${canonical} then 0 else 1 end`
    )
    .limit(1);

  if (user && user.canonicalEmail !== canonical && !user.canonicalEmail) {
    await db
      .update(onPoyntUser)
      .set({ canonicalEmail: canonical })
      .where(eq(onPoyntUser.id, user.id));
    user.canonicalEmail = canonical;
  }

  return user ?? null;
}

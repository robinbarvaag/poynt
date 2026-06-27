import { db } from "@poynt/planner-db";
import { plannerWorkspaceProfile } from "@poynt/planner-db/schema";
import {
  profileAudienceTypeLabels,
  profileCompanySizeLabels,
} from "@poynt/planner-validators";
import { eq } from "drizzle-orm";
import { getActiveWorkspaceId as resolveActiveWorkspaceId } from "./active-workspace";

/**
 * Nullable-variant av det aktive arbeidsområdet — returnerer null i stedet for å
 * kaste når brukeren ikke har noe, så profil-blokken bare faller pent tilbake.
 */
async function getActiveWorkspaceId(userId: string): Promise<string | null> {
  try {
    return await resolveActiveWorkspaceId(userId);
  } catch {
    return null;
  }
}

/**
 * Bygger «felles hjerne»-kontekstblokken fra bedriftsprofilen, så alle AI-
 * verktøyene deler samme forståelse av bedriften (størrelse, målgruppe, mål,
 * kontekst). Returnerer tom streng hvis det ikke finnes profil — da faller
 * verktøyet pent tilbake til kun skjema-svarene. Kaster aldri.
 */
export async function getWorkspaceProfileBlock(
  userId: string
): Promise<string> {
  try {
    const workspaceId = await getActiveWorkspaceId(userId);
    if (!workspaceId) return "";

    const profile = await db.query.plannerWorkspaceProfile.findFirst({
      where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
    });
    if (!profile) return "";

    const lines: string[] = [];
    if (profile.companySize) {
      lines.push(
        `Bedriftsstørrelse: ${profileCompanySizeLabels[profile.companySize]}`
      );
    }
    if (profile.audienceType) {
      lines.push(
        `Målgruppetype: ${profileAudienceTypeLabels[profile.audienceType]}`
      );
    }
    if (profile.targetAudience) {
      lines.push(`Målgruppe (beskrivelse): ${profile.targetAudience}`);
    }
    if (profile.goals && profile.goals.length > 0) {
      lines.push(`Mål: ${profile.goals.join(", ")}`);
    }
    if (profile.customContext) {
      lines.push(`Ekstra kontekst: ${profile.customContext}`);
    }

    // «Felles hjerne 2.0»: den rike merkevarebriefen. Dette er stemmen alle
    // verktøyene skal skrive i — derfor et eget, tydelig avsnitt i prompten.
    const brief = profile.brandBrief;
    let briefBlock = "";
    if (brief) {
      const briefLines: string[] = [];
      if (brief.toneOfVoice) {
        briefLines.push(`Tone of voice: ${brief.toneOfVoice}`);
      }
      if (brief.coreMessage) {
        briefLines.push(`Kjernebudskap: ${brief.coreMessage}`);
      }
      if (brief.usp) briefLines.push(`USP: ${brief.usp}`);
      if (brief.audienceInsight) {
        briefLines.push(`Målgruppe-innsikt: ${brief.audienceInsight}`);
      }
      if (brief.phrasesWeUse && brief.phrasesWeUse.length > 0) {
        briefLines.push(
          `Setninger de VILLE brukt: ${brief.phrasesWeUse.join(" | ")}`
        );
      }
      if (brief.phrasesWeAvoid && brief.phrasesWeAvoid.length > 0) {
        briefLines.push(
          `Setninger de ALDRI ville brukt: ${brief.phrasesWeAvoid.join(" | ")}`
        );
      }
      if (brief.visualStyle) {
        briefLines.push(`Visuell stil: ${brief.visualStyle}`);
      }
      if (briefLines.length > 0) {
        briefBlock = `\nMerkevarebrief — SKRIV I DENNE STEMMEN:\n${briefLines.join("\n")}\n`;
      }
    }

    // Visuell merkevare-identitet («merkevare-boka»): tagline, farger og fonter
    // gir modellen tone- og stil-signal. Logo-URL utelates (uten verdi for tekst).
    const identity = profile.brandIdentity;
    let identityBlock = "";
    if (identity) {
      const idLines: string[] = [];
      if (identity.tagline) idLines.push(`Tagline: ${identity.tagline}`);
      const colors = (identity.colors ?? []).filter((c) => c?.hex);
      if (colors.length > 0) {
        idLines.push(
          `Farger: ${colors
            .map((c) => (c.name ? `${c.name} (${c.hex})` : c.hex))
            .join(", ")}`
        );
      }
      const fontParts: string[] = [];
      if (identity.fonts?.heading) {
        fontParts.push(`overskrift «${identity.fonts.heading}»`);
      }
      if (identity.fonts?.body) {
        fontParts.push(`brødtekst «${identity.fonts.body}»`);
      }
      if (fontParts.length > 0) {
        idLines.push(`Fonter: ${fontParts.join(", ")}`);
      }
      if (idLines.length > 0) {
        identityBlock = `\nVisuell identitet:\n${idLines.join("\n")}\n`;
      }
    }

    if (lines.length === 0 && !briefBlock && !identityBlock) return "";
    const profileBlock =
      lines.length > 0
        ? `\nBedriftsprofil (bruk denne aktivt):\n${lines.join("\n")}\n`
        : "";
    return `${profileBlock}${briefBlock}${identityBlock}`;
  } catch {
    // profilberikelse er valgfri — fortsett uten
    return "";
  }
}

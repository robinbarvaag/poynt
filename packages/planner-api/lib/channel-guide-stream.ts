import { db } from "@poynt/planner-db";
import {
  plannerIndustry,
  plannerWorkspaceMember,
  plannerWorkspaceProfile,
} from "@poynt/planner-db/schema";
import {
  type ChannelGuideRequest,
  channelGuideStreamSchema,
  mainGoalLabels,
  previousChannelLabels,
  profileAudienceTypeLabels,
  profileCompanySizeLabels,
  strengthLabels,
  targetAudienceLabels,
  weeklyTimeLabels,
} from "@poynt/planner-validators";
import { streamObject } from "ai";
import { eq } from "drizzle-orm";
import { flagshipModel } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

/** Finner brukerens aktive arbeidsområde (samme logikk som workspace-profile-routeren). */
async function getActiveWorkspaceId(userId: string): Promise<string | null> {
  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: eq(plannerWorkspaceMember.userId, userId),
  });
  return membership?.workspaceId ?? null;
}

/**
 * Streamer en kanalanbefaling (`streamObject`) slik at klienten kan vise
 * resultatet bygge seg opp ett kort om gangen.
 *
 * «Felles hjerne»: i tillegg til quiz-svarene beriker vi prompten med
 * bedriftsprofilen (størrelse, målgruppe, mål, kontekst), så kanalveilederen
 * deler samme forståelse av bedriften som de andre verktøyene.
 */
export async function streamChannelGuide({
  userId,
  input,
}: {
  userId: string;
  input: ChannelGuideRequest;
}) {
  const {
    industryId,
    targetAudience,
    mainGoal,
    weeklyTime,
    strengths,
    previousChannels,
    previousExperience,
  } = input;

  // Quiz sender bransje-id; slå opp navnet.
  let industryName = industryId;
  try {
    const ind = await db.query.plannerIndustry.findFirst({
      where: eq(plannerIndustry.id, industryId),
    });
    if (ind) industryName = ind.name;
  } catch {
    // fall tilbake til id
  }

  // Hent bedriftsprofilen og bygg en kontekstblokk til prompten.
  let profileBlock = "";
  try {
    const workspaceId = await getActiveWorkspaceId(userId);
    if (workspaceId) {
      const profile = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
      });
      if (profile) {
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
        if (lines.length > 0) {
          profileBlock = `\nBedriftsprofil (bruk denne aktivt):\n${lines.join("\n")}\n`;
        }
      }
    }
  } catch {
    // profilberikelse er valgfri — fortsett uten
  }

  const previousChannelsText =
    previousChannels && previousChannels.length > 0
      ? previousChannels.map((c) => previousChannelLabels[c]).join(", ")
      : "Ingen";

  const system = await resolveSystemPrompt("channel-guide-system");

  const prompt = `
Bransje: ${industryName}
Målgruppe: ${targetAudienceLabels[targetAudience]}
Hovedmål: ${mainGoalLabels[mainGoal]}
Tid tilgjengelig per uke: ${weeklyTimeLabels[weeklyTime]}
Styrker: ${strengthLabels[strengths]}
Tidligere brukte kanaler: ${previousChannelsText}
${previousExperience ? `Tidligere erfaring: ${previousExperience}` : ""}
${profileBlock}
Anbefal de 3 beste markedskanalene for denne brukeren.`;

  return streamObject({
    model: flagshipModel,
    schema: channelGuideStreamSchema,
    system,
    prompt,
  });
}

import { db } from "@poynt/on-poynt-db";
import {
  onPoyntIndustry,
  onPoyntWorkspaceMember,
  onPoyntWorkspaceProfile,
} from "@poynt/on-poynt-db/schema";
import {
  companyLookupRequestSchema,
  updateWorkspaceProfileSchema,
} from "@poynt/on-poynt-validators";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getActiveWorkspaceId } from "../lib/active-workspace";
import { buildCompanyProfilePrefill } from "../lib/company-profile-prefill";
import { memberProcedure, router } from "../trpc";

/**
 * Verifiserer at brukeren er medlem av et gitt arbeidsområde og returnerer id-en.
 * Brukes når en spesifikk bedrift redigeres (f.eks. fra bedrifts-sheeten), så
 * man kan redigere profilen til bedriften man klikket på — ikke bare den aktive.
 */
async function resolveWorkspaceId(
  userId: string,
  workspaceId?: string
): Promise<string> {
  if (!workspaceId) {
    return getActiveWorkspaceId(userId);
  }
  const membership = await db.query.onPoyntWorkspaceMember.findFirst({
    where: and(
      eq(onPoyntWorkspaceMember.userId, userId),
      eq(onPoyntWorkspaceMember.workspaceId, workspaceId)
    ),
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Ingen tilgang til denne bedriften",
    });
  }
  return workspaceId;
}

export const workspaceProfileRouter = router({
  /**
   * Get the profile for a workspace (the active one, or an explicit workspaceId).
   */
  get: memberProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(
        ctx.userId,
        input?.workspaceId
      );

      const profile = await db.query.onPoyntWorkspaceProfile.findFirst({
        where: eq(onPoyntWorkspaceProfile.workspaceId, workspaceId),
        with: {
          industry: true,
        },
      });

      // Return empty profile structure if none exists
      if (!profile) {
        return {
          id: null,
          workspaceId,
          orgNumber: null,
          industryId: null,
          targetAudience: null,
          audienceType: null,
          companySize: null,
          goals: null,
          mainGoal: null,
          weeklyTime: null,
          strengths: null,
          customContext: null,
          brandBrief: null,
          brandIdentity: null,
          podcastFeedUrl: null,
          industry: null,
        };
      }

      return profile;
    }),

  /**
   * Upsert the profile for a workspace (the active one, or an explicit workspaceId).
   * Creates if doesn't exist, updates if it does.
   */
  upsert: memberProcedure
    .input(
      updateWorkspaceProfileSchema.extend({
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId: targetWorkspaceId, ...data } = input;
      const workspaceId = await resolveWorkspaceId(
        ctx.userId,
        targetWorkspaceId
      );

      // Check if profile exists
      const existing = await db.query.onPoyntWorkspaceProfile.findFirst({
        where: eq(onPoyntWorkspaceProfile.workspaceId, workspaceId),
      });

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(onPoyntWorkspaceProfile)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(onPoyntWorkspaceProfile.id, existing.id))
          .returning();

        return updated;
      }

      // Create new
      const id = crypto.randomUUID();
      const [created] = await db
        .insert(onPoyntWorkspaceProfile)
        .values({
          id,
          workspaceId,
          ...data,
        })
        .returning();

      return created;
    }),

  /**
   * Slår opp en bedrift i Brønnøysundregistrene og returnerer et forhåndsfyll
   * (bransje + størrelse + nettside) UI-et kan legge inn i skjemaet. Lagrer
   * ingenting selv — brukeren ser over og bekrefter, så lagrer `upsert`.
   */
  lookupByOrgNumber: memberProcedure
    .input(companyLookupRequestSchema)
    .mutation(async ({ input }) => {
      const industries = await db
        .select({
          id: onPoyntIndustry.id,
          name: onPoyntIndustry.name,
          description: onPoyntIndustry.description,
        })
        .from(onPoyntIndustry)
        .where(eq(onPoyntIndustry.isActive, true))
        .orderBy(asc(onPoyntIndustry.sortOrder), asc(onPoyntIndustry.name));

      try {
        return await buildCompanyProfilePrefill(input.orgNumber, industries);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Oppslag mot Brønnøysund feilet.",
        });
      }
    }),
});

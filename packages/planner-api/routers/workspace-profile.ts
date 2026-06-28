import { db } from "@poynt/planner-db";
import {
  plannerIndustry,
  plannerWorkspaceMember,
  plannerWorkspaceProfile,
} from "@poynt/planner-db/schema";
import {
  companyLookupRequestSchema,
  updateWorkspaceProfileSchema,
} from "@poynt/planner-validators";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getActiveWorkspaceId } from "../lib/active-workspace";
import { buildCompanyProfilePrefill } from "../lib/company-profile-prefill";
import { protectedProcedure, router } from "../trpc";

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
  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: and(
      eq(plannerWorkspaceMember.userId, userId),
      eq(plannerWorkspaceMember.workspaceId, workspaceId)
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
  get: protectedProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(
        ctx.userId,
        input?.workspaceId
      );

      const profile = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
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
  upsert: protectedProcedure
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
      const existing = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
      });

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(plannerWorkspaceProfile)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(plannerWorkspaceProfile.id, existing.id))
          .returning();

        return updated;
      }

      // Create new
      const id = crypto.randomUUID();
      const [created] = await db
        .insert(plannerWorkspaceProfile)
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
  lookupByOrgNumber: protectedProcedure
    .input(companyLookupRequestSchema)
    .mutation(async ({ input }) => {
      const industries = await db
        .select({
          id: plannerIndustry.id,
          name: plannerIndustry.name,
          description: plannerIndustry.description,
        })
        .from(plannerIndustry)
        .where(eq(plannerIndustry.isActive, true))
        .orderBy(asc(plannerIndustry.sortOrder), asc(plannerIndustry.name));

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

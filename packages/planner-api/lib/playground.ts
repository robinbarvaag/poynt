import { db } from "@poynt/planner-db";
import {
  plannerIndustry,
  plannerWorkspaceProfile,
} from "@poynt/planner-db/schema";
import {
  channelGuideRequestSchema,
  marketingPlanRequestSchema,
} from "@poynt/planner-validators";
import type { LanguageModelUsage } from "ai";
import { eq } from "drizzle-orm";
import { getActiveWorkspaceId } from "./active-workspace";
import { streamChannelGuide } from "./channel-guide";
import { streamMarketingPlan } from "./marketing-plan";
import { getPlaygroundModel, isPlaygroundModelId } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Modell-laben (`/on-poynt/lab`): kjør et verktøy med en (redigerbar) system-
 * prompt og dummy-input mot flere modeller, og sammenlign output + token-bruk.
 *
 * Den gjenbruker PRODUKSJONS-funksjonene (`streamChannelGuide` /
 * `streamMarketingPlan`) med en valgbar modell, en prompt-override og en
 * av/på for «felles hjerne», så det laben viser er nøyaktig det produksjonen
 * gjør — bare med en annen modell.
 *
 * NB: profil-berikelsen («felles hjerne») er AV som standard i laben, så alle
 * modellene får nøyaktig samme input (ingen skjult, motstridende kontekst).
 * Skrus på via `includeProfile` når man vil teste den realistiske flyten.
 */

export const PLAYGROUND_TOOL_IDS = ["channel-guide", "marketing-plan"] as const;

export type PlaygroundToolId = (typeof PLAYGROUND_TOOL_IDS)[number];

export function isPlaygroundToolId(id: string): id is PlaygroundToolId {
  return (PLAYGROUND_TOOL_IDS as readonly string[]).includes(id);
}

const TOOL_META: Record<
  PlaygroundToolId,
  {
    label: string;
    systemPromptId: string;
    systemPromptVars: Record<string, string | number>;
    exampleInput: Record<string, unknown>;
  }
> = {
  "channel-guide": {
    label: "Kanalveileder",
    systemPromptId: "channel-guide-system",
    systemPromptVars: {},
    exampleInput: {
      industryId: "Regnskap og rådgivning for småbedrifter",
      targetAudience: "b2b",
      mainGoal: "leads",
      weeklyTime: "1-2h",
      strengths: "writing",
      previousChannels: ["facebook"],
      previousExperience:
        "Har prøvd litt Facebook-annonsering uten å se resultater.",
    },
  },
  "marketing-plan": {
    label: "Markedsplan",
    systemPromptId: "marketing-plan-system",
    systemPromptVars: { channelCount: "2-3" },
    exampleInput: {
      industry: "Regnskap og rådgivning for småbedrifter",
      companySize: "small",
      mainGoal: "leads",
      timeframe: "6m",
      budget: "low",
      existingActivities: ["linkedin", "newsletter"],
      targetAudienceDescription:
        "Daglige ledere i småbedrifter (2–20 ansatte) på Vestlandet.",
      competitors:
        "Lokale regnskapskontor og nettbaserte aktører som Fiken/Conta.",
    },
  },
};

export type PlaygroundToolMeta = {
  id: PlaygroundToolId;
  label: string;
  /** Den aktive default-prompten (DB eller fallback), klar til redigering. */
  defaultSystemPrompt: string;
  /** Eksempel-input som pen JSON, klar til redigering. */
  exampleInput: string;
};

/** Klient-vennlig metadata for alle lab-verktøyene (default-prompt + eksempel). */
export async function getPlaygroundTools(): Promise<PlaygroundToolMeta[]> {
  return Promise.all(
    PLAYGROUND_TOOL_IDS.map(async (id) => {
      const meta = TOOL_META[id];
      const defaultSystemPrompt = await resolveSystemPrompt(
        meta.systemPromptId,
        meta.systemPromptVars
      );
      return {
        id,
        label: meta.label,
        defaultSystemPrompt,
        exampleInput: JSON.stringify(meta.exampleInput, null, 2),
      };
    })
  );
}

export type PlaygroundUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

/** Normaliserer token-bruk på tvers av AI-SDK-versjoner (v5/v6 feltnavn). */
export function readPlaygroundUsage(
  usage: LanguageModelUsage
): PlaygroundUsage {
  const u = usage as Record<string, unknown>;
  const num = (v: unknown): number | undefined =>
    typeof v === "number" ? v : undefined;
  return {
    inputTokens: num(u.inputTokens) ?? num(u.promptTokens),
    outputTokens: num(u.outputTokens) ?? num(u.completionTokens),
    totalTokens: num(u.totalTokens),
  };
}

export type PlaygroundStreamStart =
  | {
      ok: true;
      partialOutputStream: AsyncIterable<unknown>;
      output: PromiseLike<unknown>;
      usage: PromiseLike<LanguageModelUsage>;
    }
  | { ok: false; error: string };

/**
 * Starter en STRØMMENDE kjøring av ett verktøy med én modell. `includeProfile`
 * styrer «felles hjerne»-berikelsen — laben skrur den AV som standard, så
 * sammenligningen kun bygger på input-boksen (ingen skjult, motstridende
 * kontekst). Validerings-/oppstartsfeil pakkes i `{ ok: false }`.
 */
export async function startPlaygroundStream(params: {
  toolId: PlaygroundToolId;
  userId: string;
  modelId: string;
  systemPrompt: string;
  input: unknown;
  includeProfile: boolean;
}): Promise<PlaygroundStreamStart> {
  const modelId = params.modelId;
  if (!isPlaygroundModelId(modelId)) {
    return { ok: false, error: `Ukjent modell: ${modelId}` };
  }
  const model = getPlaygroundModel(modelId);
  try {
    if (params.toolId === "channel-guide") {
      const parsed = channelGuideRequestSchema.parse(params.input);
      const r = await streamChannelGuide({
        userId: params.userId,
        input: parsed,
        model,
        systemPromptOverride: params.systemPrompt,
        includeProfile: params.includeProfile,
      });
      return { ok: true, ...r };
    }
    const parsed = marketingPlanRequestSchema.parse(params.input);
    const r = await streamMarketingPlan({
      userId: params.userId,
      input: parsed,
      model,
      systemPromptOverride: params.systemPrompt,
      includeProfile: params.includeProfile,
    });
    return { ok: true, ...r };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Bygger dummy-input fra den AKTIVE bedriften til admin-brukeren, så laben kan
 * testes mot ekte profildata i stedet for oppdiktede eksempler. Felter profilen
 * ikke har, fylles fra eksempelet. Faller pent tilbake til eksempelet hvis det
 * ikke finnes en (brukbar) profil. `found` = profilen ga gyldig input.
 */
export async function getPlaygroundWorkspaceInput(params: {
  userId: string;
  toolId: PlaygroundToolId;
}): Promise<{ found: boolean; input: string }> {
  const { userId, toolId } = params;
  const example = TOOL_META[toolId].exampleInput;
  const fallback = { found: false, input: JSON.stringify(example, null, 2) };

  try {
    let workspaceId: string;
    try {
      workspaceId = await getActiveWorkspaceId(userId);
    } catch {
      return fallback;
    }

    const profile = await db.query.plannerWorkspaceProfile.findFirst({
      where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
    });
    if (!profile) return fallback;

    let industryName: string | undefined;
    if (profile.industryId) {
      const ind = await db.query.plannerIndustry.findFirst({
        where: eq(plannerIndustry.id, profile.industryId),
      });
      industryName = ind?.name ?? undefined;
    }

    const candidate: Record<string, unknown> = { ...example };
    if (toolId === "channel-guide") {
      if (profile.industryId) candidate.industryId = profile.industryId;
      if (profile.audienceType) candidate.targetAudience = profile.audienceType;
      if (profile.mainGoal) candidate.mainGoal = profile.mainGoal;
      if (profile.weeklyTime) candidate.weeklyTime = profile.weeklyTime;
      if (profile.strengths) candidate.strengths = profile.strengths;
      const ok = channelGuideRequestSchema.safeParse(candidate).success;
      return {
        found: ok,
        input: JSON.stringify(ok ? candidate : example, null, 2),
      };
    }

    // marketing-plan
    if (industryName) candidate.industry = industryName;
    if (profile.companySize) candidate.companySize = profile.companySize;
    if (profile.mainGoal) candidate.mainGoal = profile.mainGoal;
    if (profile.targetAudience) {
      candidate.targetAudienceDescription = profile.targetAudience;
    }
    const ok = marketingPlanRequestSchema.safeParse(candidate).success;
    return {
      found: ok,
      input: JSON.stringify(ok ? candidate : example, null, 2),
    };
  } catch {
    return fallback;
  }
}

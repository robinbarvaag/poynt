"use server";

import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { createStreamableValue } from "@ai-sdk/rsc";
import {
  scrapeWebsite,
  streamBrandBrief,
} from "@poynt/planner-api/lib/brand-brief";
import {
  type BrandBriefRequest,
  type BrandBriefStream,
  brandBriefRequestSchema,
} from "@poynt/planner-validators";
import type { DeepPartial } from "ai";
import { headers } from "next/headers";

/**
 * Server action: genererer en merkevarebrief og streamer den som en RSC
 * streamable value. Henter nettsiden via Firecrawl når en URL er oppgitt,
 * ellers brukes innlimt tekst. Selve scrapingen skjer FØR streamen starter, så
 * en scrape-feil kan kastes som en tydelig feilmelding til klienten.
 */
export async function brandBriefStreamAction(input: BrandBriefRequest) {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);
  if (!session || !hasActiveAccess(session.membership)) {
    throw new Error("Ikke innlogget");
  }

  const parsed = brandBriefRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Manglende eller ugyldige felt"
    );
  }

  const { url, pastedText, businessName } = parsed.data;

  // Skaff kildeinnholdet (kaster med klar melding ved feil → UI tilbyr fallback).
  const content = url ? await scrapeWebsite(url) : (pastedText ?? "");
  if (!content.trim()) {
    throw new Error("Fant ikke noe innhold å analysere.");
  }

  const { partialOutputStream } = await streamBrandBrief({
    content,
    businessName: businessName || undefined,
  });

  const stream = createStreamableValue<DeepPartial<BrandBriefStream>>();
  (async () => {
    try {
      for await (const partial of partialOutputStream) {
        stream.update(partial);
      }
      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return stream.value;
}

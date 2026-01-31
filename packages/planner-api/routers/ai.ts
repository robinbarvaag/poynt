import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { eq } from "drizzle-orm";
import { db } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import {
  declineRequestSchema,
  situationTypeLabels,
  relationshipTypeLabels,
  toneTypeLabels,
  channelGuideRequestSchema,
  targetAudienceLabels,
  mainGoalLabels,
  weeklyTimeLabels,
  strengthLabels,
  previousChannelLabels,
  marketingPlanRequestSchema,
  companySizeLabels,
  timeframeLabels,
  budgetLabels,
  marketingGoalLabels,
  existingActivityLabels,
  yearlyPlannerRequestSchema,
  publishChannelLabels,
  frequencyLabels,
  audienceLabels,
  contentToneLabels,
  type DeclineResponse,
  type ChannelGuideResponse,
  type MarketingPlanResponse,
  type YearlyPlannerResponse,
} from "@poynt/planner-validators";
import { publicProcedure, router } from "../trpc";

const systemPrompt = `Du er en erfaren kommunikasjonsrådgiver som hjelper gründere og småbedriftseiere med å si nei på en profesjonell og hyggelig måte.

SPRÅK OG STIL:
- Skriv alltid på norsk (bokmål)
- Bruk naturlig, muntlig norsk — ikke stivt eller oversatt
- Unngå klisjeer som "Takk for henvendelsen" eller "Jeg setter pris på..."
- Vær ærlig og direkte, men varm
- Unngå løgner og falske unnskyldninger (ikke si "har ikke tid" hvis du bare ikke vil)
- Tilpass formaliteten til relasjonen (ukjent = mer formelt, venn = mer uformelt)

STRUKTUR:
- Gi 3 varianter med tydelig ulik stil
- Hver variant skal være 2-4 setninger, klar til å sende
- Hvis "holde døren åpen" er valgt, avslutt med en åpning for fremtidig kontakt
- Hvis ikke, vær tydelig på at dette er et endelig nei

UNNGÅ:
- "Jeg håper du forstår" (passiv-aggressivt)
- "Dessverre" gjentatt (blir kjedelig)
- Overforklaring (kort er bedre)
- Å unnskylde seg for mye`;

const systemPromptWithAnalysis = `Du er en erfaren kommunikasjonsrådgiver som hjelper gründere og småbedriftseiere med å si nei på en profesjonell og hyggelig måte.

ANALYSÉR FØRST:
Les meldingen nøye og identifiser:
1. Hva ber personen om? (samarbeid, gratis arbeid, møte, etc.)
2. Hvor formell er tonen i meldingen?
3. Er dette en kald henvendelse eller noen brukeren kjenner?

SPRÅK OG STIL:
- Skriv alltid på norsk (bokmål)
- Bruk naturlig, muntlig norsk — ikke stivt eller oversatt
- Unngå klisjeer som "Takk for henvendelsen" eller "Jeg setter pris på..."
- Vær ærlig og direkte, men varm
- Unngå løgner og falske unnskyldninger
- Tilpass formaliteten til relasjonen og den opprinnelige meldingen

STRUKTUR:
- Gi 3 varianter med tydelig ulik stil
- Hver variant skal være 2-4 setninger, klar til å sende
- Hvis "holde døren åpen" er valgt, avslutt med en åpning for fremtidig kontakt
- Hvis ikke, vær tydelig på at dette er et endelig nei

UNNGÅ:
- "Jeg håper du forstår" (passiv-aggressivt)
- "Dessverre" gjentatt (blir kjedelig)
- Overforklaring (kort er bedre)
- Å unnskylde seg for mye`;

export const aiRouter = router({
  decline: publicProcedure
    .input(declineRequestSchema)
    .mutation(async ({ input }): Promise<DeclineResponse> => {
      const {
        situationType,
        relationship,
        tone,
        keepDoorOpen,
        additionalContext,
        originalMessage,
      } = input;

      // Bygg prompt basert på om vi har originalMessage og/eller situationType
      let prompt: string;
      let systemToUse: string;

      if (originalMessage && !situationType) {
        // La AI analysere situasjonen selv basert på meldingen
        systemToUse = systemPromptWithAnalysis;
        prompt = `
Opprinnelig melding å svare på:
"""
${originalMessage}
"""

Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Analyser meldingen og forstå hva personen ber om. Skriv deretter 3 varianter av et avslag:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else if (originalMessage && situationType) {
        // Vi har både melding og situasjonstype
        systemToUse = systemPrompt;
        prompt = `
Opprinnelig melding å svare på:
"""
${originalMessage}
"""

Situasjon: ${situationTypeLabels[situationType]}
Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Skriv 3 varianter av et avslag som svar på meldingen ovenfor:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else if (situationType) {
        // Bare situasjonstype, ingen melding (original oppførsel)
        systemToUse = systemPrompt;
        prompt = `
Situasjon: ${situationTypeLabels[situationType]}
Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Skriv 3 varianter av et avslag:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else {
        // Verken melding eller situasjonstype - feil
        return {
          success: false,
          error:
            "Du må enten velge en situasjonstype eller lime inn en melding.",
        };
      }

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemToUse,
          prompt,
        });

        return { success: true, result: text };
      } catch (error) {
        console.error("AI generation failed:", error);
        return {
          success: false,
          error:
            "Kunne ikke generere tekst. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  channelGuide: publicProcedure
    .input(channelGuideRequestSchema)
    .mutation(async ({ input }): Promise<ChannelGuideResponse> => {
      const {
        industryId,
        targetAudience,
        mainGoal,
        weeklyTime,
        strengths,
        previousChannels,
        previousExperience,
      } = input;

      // Look up industry name from database
      let industryName = industryId;
      try {
        const ind = await db.query.plannerIndustry.findFirst({
          where: eq(plannerIndustry.id, industryId),
        });
        if (ind) {
          industryName = ind.name;
        }
      } catch (error) {
        console.error("Could not look up industry:", error);
        // Continue with industryId as fallback
      }

      const channelGuideSystemPrompt = `Du er en erfaren markedsføringsrådgiver med 15 års erfaring fra norsk næringsliv. Din jobb er å hjelpe brukeren med å finne DE BESTE markedskanalene for deres unike situasjon.

RETURNER ALLTID GYLDIG JSON i dette formatet (INGEN markdown, INGEN kodeblokker):
{
  "reasoning": "En grundig analyse (4-6 setninger) som forklarer: 1) Hva som er unikt ved brukerens situasjon, 2) Hvilke faktorer som veier tyngst, 3) Hvorfor du valgte akkurat disse 3 kanalene, 4) Hva brukeren bør være obs på.",
  "channels": [
    {
      "name": "LinkedIn",
      "matchPercent": 87,
      "reason": "LinkedIn er perfekt for deg fordi [SPESIFIKK GRUNN basert på bransje/mål]. Målgruppen din [KONKRET DETALJ om deres målgruppe] bruker LinkedIn daglig for å [SPESIFIKK ATFERD].",
      "whyNotHigher": "Kunne vært enda bedre hvis du hadde mer tid til å bygge nettverk, eller hvis du hadde etablert ekspertise.",
      "timeToResults": "3-6 måneder",
      "weeklyTimeNeeded": "2-3 timer",
      "idealFor": ["Dele fagkunnskap", "Bygge autoritet", "Nettverke med beslutningstakere"],
      "challengingIf": ["Ikke komfortabel med å dele synspunkter", "Har lite erfaring å dele"]
    }
  ]
}

VIKTIGE REGLER FOR ANBEFALINGER:
- matchPercent skal reflektere REALISTISK match basert på ALLE faktorer (60-90% er normalt)
- Ikke gi 95%+ med mindre det er PERFEKT match på ALT
- Hvis bruker har lite tid (1-2t): Senk score for tidskrevende kanaler (YouTube, Podcast)
- Hvis bruker er B2B: LinkedIn/E-post bør score høyt, Instagram/TikTok lavere
- Hvis bruker er B2C: Sosiale medier bør score høyt
- Hvis styrke er skriving: Blogg/LinkedIn/E-post score høyere
- Hvis styrke er snakking: Podcast/Video score høyere
- Hvis styrke er visuelt: Instagram/YouTube/TikTok score høyere

FORKLARINGER MÅ VÆRE:
- SPESIFIKKE til brukerens bransje og situasjon (ikke generiske "det funker bra")
- ÆRLIGE om utfordringer og tidsbruk
- REALISTISKE om hva som skal til for å lykkes
- PEDAGOGISKE - forklar HVORFOR, ikke bare HVA

EKSEMPEL PÅ GOD REASON:
"Som [bransje] med fokus på [mål], er LinkedIn din viktigste kanal. Din målgruppe - [spesifikk beskrivelse] - bruker LinkedIn for å holde seg oppdatert på bransjenyheter og finne leverandører. Med din styrke i skriving kan du enkelt dele innsikt gjennom ukentlige poster (15-20 min). Ulempen er at det tar 3-4 måneder før du ser resultater, og du må være konsistent."

EKSEMPEL PÅ DÅRLIG REASON (IKKE gjør dette):
"LinkedIn funker godt for B2B og du kan dele innhold der."

Kanaler å velge mellom: LinkedIn, Instagram, Facebook, TikTok, YouTube, E-post/Nyhetsbrev, Podcast, Google Ads, Blogg/SEO, Twitter/X`;


      const previousChannelsText =
        previousChannels && previousChannels.length > 0
          ? previousChannels
              .map((c) => previousChannelLabels[c])
              .join(", ")
          : "Ingen";

      const prompt = `
Bransje: ${industryName}
Målgruppe: ${targetAudienceLabels[targetAudience]}
Hovedmål: ${mainGoalLabels[mainGoal]}
Tid tilgjengelig per uke: ${weeklyTimeLabels[weeklyTime]}
Styrker: ${strengthLabels[strengths]}
Tidligere brukte kanaler: ${previousChannelsText}
${previousExperience ? `Tidligere erfaring: ${previousExperience}` : ""}

Anbefal de 3 beste markedskanalene for denne brukeren.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: channelGuideSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (!parsed.channels || !Array.isArray(parsed.channels)) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          reasoning: parsed.reasoning,
          channels: parsed.channels,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere anbefalinger. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  marketingPlan: publicProcedure
    .input(marketingPlanRequestSchema)
    .mutation(async ({ input }): Promise<MarketingPlanResponse> => {
      const {
        industry,
        companySize,
        mainGoal,
        timeframe,
        budget,
        existingActivities,
        targetAudienceDescription,
        competitors,
      } = input;

      const monthCount = timeframe === "3m" ? 3 : timeframe === "6m" ? 6 : 12;

      const marketingPlanSystemPrompt = `Du er en markedsstrategirådgiver med 15 års erfaring fra norsk næringsliv. Du lager realistiske, gjennomførbare markedsplaner - ikke teoribøker.

RETURNER ALLTID GYLDIG JSON i dette formatet (INGEN markdown, INGEN kodeblokker):
{
  "summary": "Kort oppsummering av strategien (3-4 setninger som forklarer HVORFOR akkurat denne tilnærmingen)",
  "reasoning": "4-6 setninger om hvorfor akkurat denne planen passer denne bedriften. Vær spesifikk om deres situasjon, ikke generell. Hva gjorde at du valgte disse kanalene? Hva er realiteten de må forberede seg på?",
  "channels": [
    {
      "channel": "LinkedIn",
      "frequency": "3 poster per uke",
      "activities": ["Del faglig innhold om [konkret tema]", "Kommenter på andres poster", "Publiser dybdeartikkel månedlig"],
      "priority": "high",
      "expectedImpact": "30-50 kvalifiserte leads over 6 måneder hvis du er konsekvent og publiserer verdifullt innhold",
      "potentialChallenges": ["Tar 3-4 måneder før du ser resultater", "Krever jevnlig innsats også når du ikke ser umiddelbar respons"],
      "resourcesNeeded": "2-3 timer/uke for innholdsproduksjon og engasjement",
      "successMetrics": ["50+ nye relevante forbindelser per måned", "10+ kommentarer på poster", "3-5 henvendelser per kvartal"]
    }
  ],
  "timeline": [
    {
      "month": 1,
      "monthName": "Januar",
      "focus": "Grunnmur og momentum",
      "tasks": ["Optimaliser profil med nøkkelord målgruppen søker etter", "Skriv 12 innlegg på forskudd", "Identifiser 20 personer å følge"]
    }
  ],
  "weeklyRoutine": [
    {"day": "Mandag 09:00", "task": "Gjennomgå og planlegg ukens innhold (bruk innleggsbanken)", "duration": "30 min"},
    {"day": "Onsdag 08:00", "task": "Publiser hovedinnlegg + engasjer på 5 andres poster", "duration": "25 min"}
  ],
  "quickWins": ["Oppdater LinkedIn Om-seksjonen med hvem du hjelper og hvordan", "Send personlig melding til 10 gamle kunder/kolleger"],
  "tips": ["Konsistens slår perfeksjon - bedre med 2 ok poster i uka enn 0 perfekte", "Fokuser på ETT mål om gangen - ikke spre deg"]
}

KRITISKE REGLER for bedre planer:
1. SPESIFIKK reasoning (4-6 setninger):
   - IKKE skriv "LinkedIn er bra for B2B" (for generelt)
   - SKRIV "LinkedIn passer deg fordi målgruppen din (teknologiledere) er aktive der, du har styrke i skriving, og budsjettet ditt (0 kr) gjør organisk innhold til beste valg"

2. expectedImpact skal være REALISTISK og SPESIFIKK:
   - IKKE: "Økt synlighet"
   - SKRIV: "30-50 kvalifiserte leads over 6 mnd hvis konsekvent"

3. potentialChallenges skal være ÆRLIG (maks 2-3 per kanal):
   - Ikke lyv om hvor lang tid ting tar
   - Forbered dem på typiske fallgruver
   - Eksempel: "Krever 3-4 måneder før du ser resultater"

4. resourcesNeeded skal være REALISTISK:
   - IKKE: "Noen timer i uka"
   - SKRIV: "2-3 timer/uke: 1t innholdsproduksjon, 1t engasjement"

5. successMetrics skal være MÅLBARE:
   - IKKE: "Flere henvendelser"
   - SKRIV: "50+ nye forbindelser/mnd, 3-5 leads/kvartal"

6. weeklyRoutine skal ha SPESIFIKKE tidspunkt og REALISTISK varighet:
   - IKKE: "Publiser innhold"
   - SKRIV: "Mandag 09:00 - Skriv ukens hovedpost (45 min)"

7. channels: Prioriter ${monthCount <= 3 ? "1-2" : monthCount <= 6 ? "2-3" : "3-4"} kanaler basert på:
   - Deres ressurser (tid + budsjett)
   - Hvor målgruppen faktisk er
   - Deres styrker (skriver bra? video? nettverk?)
   - REALISTISK hva de klarer å følge opp

8. Timeline skal ha KONKRETE oppgaver, ikke vage:
   - IKKE: "Begynn med sosiale medier"
   - SKRIV: "Optimaliser profil med 5 nøkkelord målgruppen søker etter"

9. quickWins (4-6 stk) - ting som kan gjøres DENNE UKEN:
   - Veldig konkrete
   - Tar maks 1-2 timer hver
   - Gir faktisk effekt

10. tips (3-5 stk) - de viktigste rådene basert på DERES situasjon:
    - Ikke generiske "vær konsekvent"
    - Spesifikt for deres bransje/mål/utfordringer

TILPASS TIL:
- Solopreneur (lite tid): Fokus på 1 kanal, enkle rutiner
- Stort budsjett: Inkluder ads, verktøy, potensielt ekstern hjelp
- Ingen erfaring: Enklere kanaler først (LinkedIn vs TikTok)
- Kort tidsramme (3 mnd): VELDIG fokusert, 1-2 kanaler maks`;

      const existingActivitiesText =
        existingActivities && existingActivities.length > 0
          ? existingActivities
              .map((a) => existingActivityLabels[a])
              .join(", ")
          : "Ingen fast aktivitet";

      const prompt = `
Lag en ${monthCount}-måneders markedsplan for denne bedriften:

Bransje: ${industry}
Bedriftsstørrelse: ${companySizeLabels[companySize]}
Hovedmål: ${marketingGoalLabels[mainGoal]}
Tidsramme: ${timeframeLabels[timeframe]}
Budsjett: ${budget ? budgetLabels[budget] : "Ikke oppgitt"}
Eksisterende aktiviteter: ${existingActivitiesText}
${targetAudienceDescription ? `Målgruppe: ${targetAudienceDescription}` : ""}
${competitors ? `Konkurrenter: ${competitors}` : ""}

Lag en praktisk og gjennomførbar plan med fokus på ${marketingGoalLabels[mainGoal].toLowerCase()}.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: marketingPlanSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (!parsed.summary || !parsed.channels || !parsed.timeline) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          plan: parsed,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere markedsplan. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  yearlyPlanner: publicProcedure
    .input(yearlyPlannerRequestSchema)
    .mutation(async ({ input }): Promise<YearlyPlannerResponse> => {
      const {
        industry,
        channels,
        frequency,
        audience,
        tone,
        importantDates,
        focusTopics,
      } = input;

      const currentYear = new Date().getFullYear();

      const yearlyPlannerSystemPrompt = `Du er en erfaren innholdsstrateg som lager årsplaner for norske bedrifter.

RETURNER ALLTID GYLDIG JSON i dette formatet (INGEN markdown, INGEN kodeblokker):
{
  "summary": "Kort oppsummering av årsplanen (2-3 setninger)",
  "year": ${currentYear},
  "months": [
    {
      "month": 1,
      "monthName": "Januar",
      "theme": "Nytt år, nye mål",
      "posts": [
        {"week": 1, "channel": "LinkedIn", "idea": "Del dine mål for året", "type": "post"},
        {"week": 2, "channel": "Instagram", "idea": "Behind the scenes fra kontoret", "type": "reel"}
      ],
      "keyDates": [
        {"date": "1. januar", "event": "Nyttårsdag", "contentIdea": "Ønsk følgerne godt nyttår"}
      ],
      "tips": ["Start året med å dele visjonen din"]
    }
  ],
  "overallTips": ["Vær konsekvent med publisering", "Engasjer med følgerne dine"]
}

VIKTIGE REGLER:
- Svar KUN med JSON, ingen annen tekst
- Lag innhold for alle 12 måneder
- Tilpass antall posts per måned til frekvensen
- Ta hensyn til norske høytider og sesonger
- Inkluder bransje-spesifikke datoer og events
- Varier mellom kanalene brukeren har valgt
- "type" kan være: post, story, reel, video, artikkel, nyhetsbrev, podcast-episode
- keyDates skal inkludere relevante norske merkedager
- Alt på norsk`;

      const channelsText = channels
        .map((c) => publishChannelLabels[c])
        .join(", ");

      const prompt = `
Lag en komplett årsplan for innholdspublisering:

Bransje: ${industry}
Kanaler: ${channelsText}
Publiseringsfrekvens: ${frequencyLabels[frequency]}
Målgruppe: ${audienceLabels[audience]}
${tone ? `Tone of voice: ${contentToneLabels[tone]}` : ""}
${importantDates ? `Viktige datoer for bedriften: ${importantDates}` : ""}
${focusTopics ? `Fokusområder/temaer: ${focusTopics}` : ""}

Lag en praktisk årsplan med konkrete innholdsideer for hver måned, tilpasset bransjen og norske sesonger.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: yearlyPlannerSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (!parsed.summary || !parsed.months || !Array.isArray(parsed.months)) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          plan: parsed,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere årsplan. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),
});

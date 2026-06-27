"use client";

import { brandBriefStreamAction } from "@/lib/planner/actions/brand-brief";
import { trpc } from "@/lib/planner/trpc";
import { readStreamableValue } from "@ai-sdk/rsc";
import type { BrandBrief } from "@poynt/planner-validators";
import {
  Badge,
  Button,
  Input,
  Skeleton,
  Text,
  Textarea,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useCallback, useEffect, useState } from "react";

interface BrandBriefSectionProps {
  workspaceId: string;
  businessName?: string;
  disabled?: boolean;
}

const splitLines = (text: string): string[] =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

/** Liten feltetikett (rent visuell — feltene er Textarea/Input under). */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-sm">{children}</p>;
}

/**
 * «Felles hjerne 2.0»: genererer en merkevarebrief fra bedriftens nettside
 * (Firecrawl) eller innlimt tekst, lar brukeren se den over og redigere, og
 * lagrer den på workspace-profilen — der alle AI-verktøyene plukker den opp.
 */
export function BrandBriefSection({
  workspaceId,
  businessName,
  disabled = false,
}: BrandBriefSectionProps) {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<"input" | "brief">("input");
  const [isStreaming, setIsStreaming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generator-input
  const [url, setUrl] = useState("");
  const [usePaste, setUsePaste] = useState(false);
  const [pastedText, setPastedText] = useState("");

  // Redigerbare brief-felt
  const [tone, setTone] = useState("");
  const [coreMessage, setCoreMessage] = useState("");
  const [usp, setUsp] = useState("");
  const [audienceInsight, setAudienceInsight] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [useText, setUseText] = useState("");
  const [avoidText, setAvoidText] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const populate = useCallback((brief: BrandBrief) => {
    setTone(brief.toneOfVoice ?? "");
    setCoreMessage(brief.coreMessage ?? "");
    setUsp(brief.usp ?? "");
    setAudienceInsight(brief.audienceInsight ?? "");
    setVisualStyle(brief.visualStyle ?? "");
    setUseText((brief.phrasesWeUse ?? []).join("\n"));
    setAvoidText((brief.phrasesWeAvoid ?? []).join("\n"));
    setSourceUrl(brief.sourceUrl ?? null);
  }, []);

  // Last inn ev. eksisterende brief.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await trpc.workspaceProfile.get.query({ workspaceId });
        if (!active) return;
        const brief = profile?.brandBrief as BrandBrief | null | undefined;
        if (brief && Object.values(brief).some(Boolean)) {
          populate(brief);
          setScreen("brief");
        }
      } catch {
        // ignorer — vis generator-skjermen
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [workspaceId, populate]);

  async function generate() {
    setScreen("brief");
    setIsStreaming(true);
    // Nullstill feltene så streamen fyller dem fra blankt.
    populate({});
    try {
      const stream = await brandBriefStreamAction({
        url: usePaste ? "" : url,
        pastedText: usePaste ? pastedText : "",
        businessName,
      });
      for await (const partial of readStreamableValue(stream)) {
        if (!partial) continue;
        if (partial.toneOfVoice != null) setTone(partial.toneOfVoice);
        if (partial.coreMessage != null) setCoreMessage(partial.coreMessage);
        if (partial.usp != null) setUsp(partial.usp);
        if (partial.audienceInsight != null) {
          setAudienceInsight(partial.audienceInsight);
        }
        if (partial.visualStyle != null) setVisualStyle(partial.visualStyle);
        if (partial.phrasesWeUse) {
          setUseText(
            partial.phrasesWeUse
              .filter((p): p is string => Boolean(p))
              .join("\n")
          );
        }
        if (partial.phrasesWeAvoid) {
          setAvoidText(
            partial.phrasesWeAvoid
              .filter((p): p is string => Boolean(p))
              .join("\n")
          );
        }
      }
      setSourceUrl(usePaste ? null : url || null);
      toast.success("Merkevarebrief generert — se over og lagre.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kunne ikke generere briefen."
      );
      setScreen("input");
    } finally {
      setIsStreaming(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const brandBrief: BrandBrief = {
        toneOfVoice: tone || null,
        coreMessage: coreMessage || null,
        usp: usp || null,
        audienceInsight: audienceInsight || null,
        visualStyle: visualStyle || null,
        phrasesWeUse: splitLines(useText),
        phrasesWeAvoid: splitLines(avoidText),
        sourceUrl,
      };
      await trpc.workspaceProfile.upsert.mutate({ workspaceId, brandBrief });
      toast.success("Merkevarebrief lagret. Alle verktøyene bruker den nå.");
    } catch {
      toast.error("Kunne ikke lagre. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const canGenerate = usePaste
    ? pastedText.trim().length > 0
    : url.trim().length > 0;

  // Generator-skjerm
  if (screen === "input") {
    return (
      <div className="space-y-5">
        <Text variant="muted">
          Vi leser bedriftens nettside og destillerer stemmen, kjernebudskapet
          og det som skiller dere ut. Briefen mater alle AI-verktøyene, så de
          skriver som dere — ikke som en generisk robot.
        </Text>

        {usePaste ? (
          <div className="space-y-2">
            <FieldLabel>Lim inn tekst om bedriften</FieldLabel>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Lim inn tekst fra nettsiden, om-siden, eller en beskrivelse av bedriften …"
              className="min-h-40 resize-none"
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <FieldLabel>Nettside-URL</FieldLabel>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://bedriften.no"
              disabled={disabled}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={generate}
            disabled={disabled || !canGenerate}
            className="gap-2"
          >
            <Icon name="zap" className="size-4" />
            Generer merkevarebrief
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-muted-foreground"
            onClick={() => setUsePaste((v) => !v)}
          >
            {usePaste ? "Bruk nettside-URL i stedet" : "Lim inn tekst i stedet"}
          </Button>
        </div>
      </div>
    );
  }

  // Brief-skjerm (streaming eller redigerbar)
  return (
    <div className="space-y-6">
      {isStreaming && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Icon name="loader" className="size-4 animate-spin" />
          Leser kilden og skriver merkevarebriefen …
        </div>
      )}

      {sourceUrl && !isStreaming && (
        <Badge variant="muted" size="sm">
          Generert fra {sourceUrl}
        </Badge>
      )}

      <div className="space-y-2">
        <FieldLabel>Tone of voice</FieldLabel>
        <Textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="min-h-24 resize-none"
          disabled={disabled || isStreaming}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Setninger dere VILLE brukt (én per linje)</FieldLabel>
          <Textarea
            value={useText}
            onChange={(e) => setUseText(e.target.value)}
            className="min-h-28 resize-none"
            disabled={disabled || isStreaming}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>
            Setninger dere ALDRI ville brukt (én per linje)
          </FieldLabel>
          <Textarea
            value={avoidText}
            onChange={(e) => setAvoidText(e.target.value)}
            className="min-h-28 resize-none"
            disabled={disabled || isStreaming}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>Kjernebudskap</FieldLabel>
        <Textarea
          value={coreMessage}
          onChange={(e) => setCoreMessage(e.target.value)}
          className="min-h-20 resize-none"
          disabled={disabled || isStreaming}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Det som skiller dere ut (USP)</FieldLabel>
        <Textarea
          value={usp}
          onChange={(e) => setUsp(e.target.value)}
          className="min-h-20 resize-none"
          disabled={disabled || isStreaming}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Målgruppe-innsikt (hvem, smertepunkter, ønsker)</FieldLabel>
        <Textarea
          value={audienceInsight}
          onChange={(e) => setAudienceInsight(e.target.value)}
          className="min-h-24 resize-none"
          disabled={disabled || isStreaming}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Visuell stil</FieldLabel>
        <Input
          value={visualStyle}
          onChange={(e) => setVisualStyle(e.target.value)}
          disabled={disabled || isStreaming}
        />
      </div>

      {!disabled && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={save}
            disabled={isStreaming || saving}
            className="gap-2"
          >
            {saving ? (
              <Icon name="loader" className="size-4 animate-spin" />
            ) : (
              <Icon name="check" className="size-4" />
            )}
            Lagre merkevarebrief
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setScreen("input")}
            disabled={isStreaming || saving}
            className="gap-2"
          >
            <Icon name="refresh" className="size-4" />
            Generer på nytt
          </Button>
        </div>
      )}
    </div>
  );
}

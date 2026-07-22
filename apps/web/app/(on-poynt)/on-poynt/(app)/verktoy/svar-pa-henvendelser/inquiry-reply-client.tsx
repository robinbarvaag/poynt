"use client";

import { inquiryReplyStreamAction } from "@/lib/planner/actions/inquiry-reply";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import {
  type InquiryGoal,
  type InquiryReplyRequest,
  type InquiryReplyStream,
  type InquirySource,
  type InquiryVariant,
  type ReplySentiment,
  inquiryGoalLabels,
  inquiryGoals,
  inquiryReplyRequestSchema,
  inquirySourceLabels,
  inquirySources,
  replySentimentLabels,
  replySentiments,
} from "@poynt/planner-validators";
import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PageShell,
  Textarea,
  toast,
} from "@poynt/ui";
import { useState } from "react";

const SENTIMENT_VARIANT: Record<ReplySentiment, BadgeProps["variant"]> = {
  positive: "secondary",
  neutral: "outline",
  negative: "destructive",
};

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Kopiert");
  } catch {
    toast.error("Kunne ikke kopiere");
  }
}

export function InquiryReplyClient({
  initialSaved,
}: {
  initialSaved: InquiryReplyStream | null;
}) {
  const [source, setSource] = useState<InquirySource>("google_review");
  const [sentiment, setSentiment] = useState<ReplySentiment | "">("");
  const [goal, setGoal] = useState<InquiryGoal | "">("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { generate, result, isPending } = useToolStream<
    InquiryReplyRequest,
    InquiryReplyStream
  >({
    action: inquiryReplyStreamAction,
    toolId: "inquiry-reply",
    title: "Svar på henvendelse",
    buildResult: (data) => ({
      detectedSentiment: data.detectedSentiment,
      summary: data.summary,
      variants: data.variants,
      tips: data.tips,
    }),
    onError: () => {
      setError("Kunne ikke generere svar. Prøv igjen.");
    },
  });

  function submit() {
    setError(null);
    const parsed = inquiryReplyRequestSchema.safeParse({
      incomingMessage,
      source,
      sentiment: sentiment || undefined,
      goal: goal || undefined,
      extraContext: extraContext || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sjekk feltene.");
      return;
    }
    generate(parsed.data);
  }

  const current = result ?? initialSaved;
  const variants = (current?.variants ?? []) as Array<Partial<InquiryVariant>>;
  const tips = (current?.tips ?? []) as string[];

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">
          Svar på henvendelser
        </h1>
        <p className="text-muted-foreground text-sm">
          Lim inn en anmeldelse, kundehenvendelse eller klage — få 2-3 ferdige
          svar i bedriftens stemme, klare til å sende.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meldingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hvor kom den fra?</Label>
            <div className="flex flex-wrap gap-2">
              {inquirySources.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={s === source ? "default" : "outline"}
                  onClick={() => setSource(s)}
                >
                  {inquirySourceLabels[s]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incoming">Meldingen du vil svare på</Label>
            <Textarea
              id="incoming"
              value={incomingMessage}
              maxLength={2000}
              placeholder="Lim inn anmeldelsen eller henvendelsen her…"
              onChange={(e) => setIncomingMessage(e.target.value)}
              className="min-h-32"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone (valgfritt)</Label>
              <div className="flex flex-wrap gap-2">
                {replySentiments.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={s === sentiment ? "default" : "outline"}
                    onClick={() => setSentiment(s === sentiment ? "" : s)}
                  >
                    {replySentimentLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mål med svaret (valgfritt)</Label>
              <div className="flex flex-wrap gap-2">
                {inquiryGoals.map((g) => (
                  <Button
                    key={g}
                    type="button"
                    size="sm"
                    variant={g === goal ? "default" : "outline"}
                    onClick={() => setGoal(g === goal ? "" : g)}
                  >
                    {inquiryGoalLabels[g]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctx">Ekstra kontekst (valgfritt)</Label>
            <Input
              id="ctx"
              value={extraContext}
              maxLength={500}
              placeholder="F.eks. «kunden ventet for lenge på levering»"
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end">
            <Button type="button" onClick={submit} disabled={isPending}>
              {isPending ? "Genererer…" : "Lag svar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {current && (
        // Toner inn ved mount (ikke keyet på innholdet — det strømmer).
        <section className="motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in space-y-4 motion-safe:duration-300 motion-safe:ease-soft">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading font-semibold text-lg">Forslag</h2>
            {current.detectedSentiment && (
              <Badge variant={SENTIMENT_VARIANT[current.detectedSentiment]}>
                {replySentimentLabels[current.detectedSentiment]}
              </Badge>
            )}
            {isPending && (
              <span className="text-muted-foreground text-xs">Strømmer…</span>
            )}
          </div>

          {current.summary && (
            <p className="text-muted-foreground text-sm">{current.summary}</p>
          )}

          <div className="space-y-3">
            {variants.map((v, i) => (
              <Card key={`${v.label ?? "variant"}-${i}`}>
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {v.label ?? "Forslag"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {v.tone && (
                        <Badge variant="outline" className="font-normal">
                          {v.tone}
                        </Badge>
                      )}
                      {v.text && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => v.text && copy(v.text)}
                        >
                          Kopier
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {v.text ?? "…"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                  {tips.filter(Boolean).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </PageShell>
  );
}

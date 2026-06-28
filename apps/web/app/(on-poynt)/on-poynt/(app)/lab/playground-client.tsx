"use client";

import {
  type PlaygroundChunk,
  loadWorkspaceInputAction,
  streamPlaygroundModelAction,
} from "@/lib/planner/actions/playground";
import { readStreamableValue } from "@ai-sdk/rsc";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  PageShell,
  Textarea,
} from "@poynt/ui";
import { useMemo, useState, useTransition } from "react";

type ToolMeta = {
  id: string;
  label: string;
  defaultSystemPrompt: string;
  exampleInput: string;
};

type ModelMeta = { id: string; label: string; provider: string };

type Props = {
  tools: ToolMeta[];
  models: ModelMeta[];
};

type ModelRunState = {
  status: "running" | "done" | "error";
  output?: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  cost?: { usd: number; nok: number };
  ms?: number;
  error?: string;
};

const DEFAULT_MODELS = ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"];

export function PlaygroundClient({ tools, models }: Props) {
  const [toolId, setToolId] = useState(tools[0]?.id ?? "");
  const activeTool = useMemo(
    () => tools.find((t) => t.id === toolId) ?? tools[0],
    [tools, toolId]
  );

  const [systemPrompt, setSystemPrompt] = useState(
    activeTool?.defaultSystemPrompt ?? ""
  );
  const [inputJson, setInputJson] = useState(activeTool?.exampleInput ?? "");
  const [selectedModels, setSelectedModels] = useState<string[]>(() =>
    DEFAULT_MODELS.filter((id) => models.some((m) => m.id === id))
  );
  const [includeProfile, setIncludeProfile] = useState(false);

  const [runOrder, setRunOrder] = useState<string[]>([]);
  const [runStates, setRunStates] = useState<Record<string, ModelRunState>>({});
  const [running, setRunning] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [inputNote, setInputNote] = useState<string | null>(null);
  const [loadingInput, startLoadInput] = useTransition();

  // Bytt verktøy → seed prompt + input på nytt.
  function selectTool(next: ToolMeta) {
    setToolId(next.id);
    setSystemPrompt(next.defaultSystemPrompt);
    setInputJson(next.exampleInput);
    setRunOrder([]);
    setRunStates({});
    setError(null);
    setInputNote(null);
  }

  // Hent ekte input fra den aktive bedriften (faller tilbake til eksempel).
  function loadFromWorkspace() {
    setInputNote(null);
    startLoadInput(async () => {
      const res = await loadWorkspaceInputAction(toolId);
      if (!res.ok) {
        setInputNote(res.error ?? "Kunne ikke hente.");
        return;
      }
      if (res.input) setInputJson(res.input);
      setInputNote(
        res.found
          ? "Hentet fra aktiv bedrift."
          : "Fant ingen brukbar profil på aktiv bedrift — bruker eksempel."
      );
    });
  }

  function toggleModel(id: string) {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function resetPrompt() {
    if (activeTool) setSystemPrompt(activeTool.defaultSystemPrompt);
  }
  function resetInput() {
    if (activeTool) setInputJson(activeTool.exampleInput);
    setInputNote(null);
  }

  function setOne(modelId: string, next: Partial<ModelRunState>) {
    setRunStates((prev) => ({
      ...prev,
      [modelId]: { ...(prev[modelId] ?? { status: "running" }), ...next },
    }));
  }

  function run() {
    setError(null);
    // Valider JSON klientside før vi fyrer av N kall.
    try {
      JSON.parse(inputJson);
    } catch {
      setError("Input er ikke gyldig JSON.");
      return;
    }

    const order = [...selectedModels];
    setRunOrder(order);
    setRunStates(
      Object.fromEntries(order.map((id) => [id, { status: "running" }]))
    );
    setRunning(true);

    Promise.all(
      order.map(async (modelId) => {
        try {
          const value = await streamPlaygroundModelAction({
            toolId,
            systemPrompt,
            inputJson,
            modelId,
            includeProfile,
          });
          for await (const chunk of readStreamableValue<PlaygroundChunk>(
            value
          )) {
            if (!chunk) continue;
            if (chunk.type === "partial") {
              setOne(modelId, { status: "running", output: chunk.output });
            } else if (chunk.type === "done") {
              setOne(modelId, {
                status: "done",
                output: chunk.output,
                usage: chunk.usage,
                cost: chunk.cost,
                ms: chunk.ms,
              });
            } else {
              setOne(modelId, { status: "error", error: chunk.error });
            }
          }
        } catch (e) {
          setOne(modelId, {
            status: "error",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      })
    ).finally(() => setRunning(false));
  }

  const modelLabel = (id: string) =>
    models.find((m) => m.id === id)?.label ?? id;

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">Modell-lab</h1>
        <p className="text-muted-foreground text-sm">
          Tweak system-prompten og dummy-data, kjør mot flere modeller, og
          sammenlign output, latency og token-kostnad side om side. Intern,
          admin-gated. Påvirker ikke produksjon.
        </p>
      </header>

      {/* Verktøy-velger */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Verktøy:</span>
        {tools.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={t.id === toolId ? "default" : "outline"}
            onClick={() => selectTool(t)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* System-prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-prompt">System-prompt</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetPrompt}
            >
              Tilbakestill
            </Button>
          </div>
          <Textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="min-h-72 font-mono text-xs"
            spellCheck={false}
          />
        </div>

        {/* Dummy-input */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="input-json">Dummy-input (JSON)</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={loadFromWorkspace}
                disabled={loadingInput}
              >
                {loadingInput ? "Henter…" : "Hent fra aktiv bedrift"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetInput}
              >
                Eksempel
              </Button>
            </div>
          </div>
          <Textarea
            id="input-json"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            className="min-h-72 font-mono text-xs"
            spellCheck={false}
          />
          {inputNote && (
            <p className="text-muted-foreground text-xs">{inputNote}</p>
          )}
        </div>
      </div>

      {/* Modeller + valg + kjør */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-muted-foreground text-sm">Modeller</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {models.map((m) => {
                const cbId = `model-${m.id.replace(/\//g, "-")}`;
                return (
                  <label
                    key={m.id}
                    htmlFor={cbId}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      id={cbId}
                      checked={selectedModels.includes(m.id)}
                      onCheckedChange={() => toggleModel(m.id)}
                    />
                    <span>{m.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {m.provider}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label
            htmlFor="include-profile"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              id="include-profile"
              checked={includeProfile}
              onCheckedChange={(v) => setIncludeProfile(v === true)}
            />
            <span>Berik med «felles hjerne» (aktiv bedrift)</span>
          </label>
          <p className="max-w-xl text-muted-foreground text-xs">
            Av som standard: da bygger kjøringen kun på input-boksen, så
            modellene får nøyaktig samme data. Skru på for å teste med skjult
            profil-kontekst — men da kan resultatene divergere om input og
            profil spriker.
          </p>
        </div>

        <Button
          type="button"
          onClick={run}
          disabled={running || selectedModels.length === 0}
        >
          {running
            ? "Kjører…"
            : `Kjør (${selectedModels.length} ${
                selectedModels.length === 1 ? "modell" : "modeller"
              })`}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Resultater — strømmer live per modell */}
      {runOrder.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              runOrder.length,
              2
            )}, minmax(0, 1fr))`,
          }}
        >
          {runOrder.map((modelId) => {
            const r = runStates[modelId] ?? { status: "running" };
            return (
              <Card key={modelId} className="overflow-hidden">
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {modelLabel(modelId)}
                    </CardTitle>
                    <Badge
                      variant={
                        r.status === "done"
                          ? "secondary"
                          : r.status === "error"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {r.status === "done"
                        ? "Ferdig"
                        : r.status === "error"
                          ? "Feil"
                          : "Strømmer…"}
                    </Badge>
                  </div>
                  {r.status === "done" && (
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                      {r.ms != null && <span>{(r.ms / 1000).toFixed(1)}s</span>}
                      {r.usage?.inputTokens != null && (
                        <span>{r.usage.inputTokens} inn</span>
                      )}
                      {r.usage?.outputTokens != null && (
                        <span>{r.usage.outputTokens} ut</span>
                      )}
                      {r.usage?.totalTokens != null && (
                        <span>{r.usage.totalTokens} tok</span>
                      )}
                      {r.cost != null && (
                        <span className="font-medium text-foreground">
                          ≈ {r.cost.nok.toFixed(3)} kr
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {r.status === "error" ? (
                    <p className="text-destructive text-sm">{r.error}</p>
                  ) : r.output !== undefined ? (
                    <pre className="max-h-128 overflow-auto rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                      {JSON.stringify(r.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground text-sm">Starter…</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { vekstVars } from "./palette";

export type WorkflowIcon =
  | "mic"
  | "file-text"
  | "users"
  | "search"
  | "image"
  | "lightbulb";

export interface Workflow {
  title: string;
  description?: string;
  /** Det du gir verktøyet, f.eks. «Talememo fra turen». */
  inputLabel?: string;
  inputIcon?: WorkflowIcon;
  /** Det du får tilbake, f.eks. «Tre prioriteringer». */
  outputLabel?: string;
  prompt: string;
  /** Forhåndsskrevet eksempel på svaret. Ingen KI kalles på siden. */
  exampleOutput?: string;
  /** `board` viser svaret som chatbobler, én per «Navn: tekst»-linje. */
  style?: "standard" | "board";
}

export interface AiWorkflowProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  workflows: Workflow[];
  palette?: ChapterPalette;
  className?: string;
}

type Phase = "idle" | "input" | "prompt" | "output";

const BUBBLE_COLORS = [
  "bg-accent-1",
  "bg-accent-2",
  "bg-accent-3",
  "bg-[var(--vk-surface)] text-[var(--vk-ink)]",
];

function parseBoard(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^([^:]{1,40}):\s*(.+)$/.exec(line);
      return match
        ? { speaker: match[1].trim(), text: match[2].trim() }
        : { speaker: "", text: line };
    });
}

function Node({
  icon,
  kicker,
  label,
  active,
}: {
  icon: IconName;
  kicker: string;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 transition-all duration-300",
        active && "-translate-y-0.5 shadow-md ring-2 ring-foreground"
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--vk-surface)] text-[var(--vk-ink)]">
        <Icon name={icon} className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-muted-foreground text-xs uppercase tracking-wider">
          {kicker}
        </span>
        <span className="block font-heading font-semibold text-sm leading-snug">
          {label}
        </span>
      </span>
    </div>
  );
}

function Wire({ flowing }: { flowing: boolean }) {
  const reduceMotion = useReducedMotion();
  const dot = flowing && !reduceMotion;
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-6 w-0 border-foreground/30 border-l-2 border-dashed sm:mx-0 sm:h-0 sm:w-10 sm:self-center sm:border-t-2 sm:border-l-0"
    >
      {dot && (
        <>
          <motion.span
            className="absolute -left-[5px] size-2 rounded-full bg-foreground sm:hidden"
            animate={{ top: ["0%", "100%"] }}
            transition={{
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.span
            className="absolute -top-[5px] hidden size-2 rounded-full bg-foreground sm:block"
            animate={{ left: ["0%", "100%"] }}
            transition={{
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * Arbeidsflyter med KI som små maskiner: input → prompt → resultat. «Kjør
 * eksempelet» sender prikker langs ledningene og skriver ut et ferdig
 * eksempel. Prompten kan kopieres eller åpnes rett i ChatGPT eller Claude.
 */
export function AiWorkflow({
  eyebrow,
  title,
  intro,
  workflows,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: AiWorkflowProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState(0);
  const [copied, setCopied] = useState(false);

  const workflow = workflows[Math.min(active, workflows.length - 1)];
  const output = workflow?.exampleOutput ?? "";
  const board = workflow?.style === "board";
  const bubbles = board ? parseBoard(output) : [];
  const units = board ? bubbles.length : output.length;

  // Stegene i «kjøringen»: input lyser, så prompten, så skrives svaret ut.
  useEffect(() => {
    if (phase === "input" || phase === "prompt") {
      const timer = setTimeout(
        () => setPhase(phase === "input" ? "prompt" : "output"),
        650
      );
      return () => clearTimeout(timer);
    }
    if (phase === "output") {
      if (shown >= units) {
        setPhase("idle");
        return;
      }
      const timer = setTimeout(
        () => setShown((n) => Math.min(units, n + (board ? 1 : 3))),
        board ? 900 : 16
      );
      return () => clearTimeout(timer);
    }
  }, [phase, shown, units, board]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!workflow) return null;

  const running = phase !== "idle";
  const visible = phase === "idle" ? units : phase === "output" ? shown : 0;

  function run() {
    if (reduceMotion) return;
    setShown(0);
    setPhase("input");
  }

  function select(index: number) {
    setActive(index);
    setPhase("idle");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(workflow.prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const encoded = encodeURIComponent(workflow.prompt);

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      {workflows.length > 1 && (
        <div
          role="tablist"
          aria-label="Arbeidsflyter"
          className="mb-4 flex flex-wrap gap-2"
        >
          {workflows.map((item, i) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => select(i)}
              className={cn(
                "rounded-full px-4 py-2 font-heading font-semibold text-sm ring-1 ring-foreground/15 transition-colors",
                i === active
                  ? "bg-[var(--vk-surface)] text-[var(--vk-ink)] ring-transparent"
                  : "bg-card hover:bg-muted"
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <div
        role="tabpanel"
        className="flex flex-col gap-6 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-8"
      >
        <div className="flex flex-col gap-2">
          <h3 className="font-bold font-heading text-2xl leading-tight">
            {workflow.title}
          </h3>
          {workflow.description && (
            <p className="max-w-2xl text-muted-foreground leading-relaxed">
              {workflow.description}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <Node
            icon={(workflow.inputIcon ?? "file-text") as IconName}
            kicker="Du gir"
            label={workflow.inputLabel || "Din situasjon"}
            active={phase === "input"}
          />
          <Wire flowing={phase === "input"} />
          <Node
            icon="bot"
            kicker="KI-verktøyet får"
            label="Prompten under"
            active={phase === "prompt"}
          />
          <Wire flowing={phase === "prompt"} />
          <Node
            icon="lightbulb"
            kicker="Du får"
            label={workflow.outputLabel || "Et forslag"}
            active={phase === "output"}
          />
        </div>

        {output && (
          <div aria-busy={running}>
            {board ? (
              <ol className="flex min-h-40 flex-col gap-3 rounded-2xl bg-muted/50 p-4">
                {bubbles.slice(0, visible).map((bubble, i) => {
                  const speakers = [...new Set(bubbles.map((b) => b.speaker))];
                  const color =
                    BUBBLE_COLORS[
                      speakers.indexOf(bubble.speaker) % BUBBLE_COLORS.length
                    ];
                  return (
                    <motion.li
                      // biome-ignore lint/suspicious/noArrayIndexKey: boblene står i fast rekkefølge
                      key={i}
                      initial={
                        reduceMotion || phase === "idle"
                          ? false
                          : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full font-bold font-heading text-foreground text-sm",
                          color
                        )}
                        aria-hidden="true"
                      >
                        {(bubble.speaker || "?").charAt(0)}
                      </span>
                      <span className="rounded-2xl rounded-tl-sm bg-card px-4 py-2.5 shadow-sm ring-1 ring-foreground/5">
                        {bubble.speaker && (
                          <span className="block font-heading font-semibold text-sm">
                            {bubble.speaker}
                          </span>
                        )}
                        <span className="block leading-relaxed">
                          {bubble.text}
                        </span>
                      </span>
                    </motion.li>
                  );
                })}
                {phase === "output" && visible < units && (
                  <li aria-hidden="true" className="flex gap-1 pl-12">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-2 rounded-full bg-foreground/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.9,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: d * 0.15,
                        }}
                      />
                    ))}
                  </li>
                )}
              </ol>
            ) : (
              <pre className="min-h-40 whitespace-pre-wrap break-words rounded-2xl bg-foreground p-5 font-mono text-background text-sm leading-relaxed">
                {output.slice(0, visible)}
                {phase === "output" && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-background align-middle"
                  />
                )}
              </pre>
            )}
            <p className="mt-2 text-muted-foreground text-xs">
              Eksempel på et svar. Ditt svar blir annerledes.
            </p>
          </div>
        )}

        <details className="group rounded-2xl bg-muted/60 ring-1 ring-foreground/5">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 px-4 py-3 font-heading font-semibold text-sm">
            Se prompten
            <Icon
              name="chevron-down"
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words px-4 pb-4 font-mono text-[0.8rem] text-foreground/90 leading-relaxed">
            {workflow.prompt}
          </pre>
        </details>

        <div className="flex flex-wrap gap-2">
          {output && !reduceMotion && (
            <Button
              type="button"
              onClick={run}
              disabled={running}
              className="rounded-full"
            >
              <Icon name="play" className="mr-2 size-4" />
              {running ? "Kjører …" : "Kjør eksempelet"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={copy}
            className="rounded-full"
            aria-live="polite"
          >
            <Icon name={copied ? "check" : "copy"} className="mr-2 size-4" />
            {copied ? "Kopiert" : "Kopier prompt"}
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a
              href={`https://chatgpt.com/?q=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Åpne i ChatGPT
              <Icon name="external-link" className="ml-2 size-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a
              href={`https://claude.ai/new?q=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Åpne i Claude
              <Icon name="external-link" className="ml-2 size-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

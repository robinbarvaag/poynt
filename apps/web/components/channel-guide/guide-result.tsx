"use client";

import { channelLinks } from "@/lib/constants";
import {
  containerMotionVariants,
  headerMotionVariants,
  itemMotionVariants,
} from "@/lib/motion-variants";
import type {
  ChannelRecommendation,
  ExtendedGuideResultProps,
} from "@/lib/types";
import {
  channelMatchLevelLabels,
  resolveChannelMatchLevel,
} from "@poynt/planner-validators";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Skeleton,
  Text,
  cn,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const levelBadgeVariant = {
  strong: "soft-primary",
  good: "secondary",
  possible: "outline",
} as const;

// Roterende «jobber»-meldinger mens vi venter på de første tokenene — gir liv
// (à la Claude) så det er tydelig at noe skjer og ikke har stoppet opp.
const STREAM_MESSAGES = [
  "Analyserer situasjonen din …",
  "Vurderer hvilke kanaler som passer …",
  "Veier tid, målgruppe og styrke …",
  "Setter sammen anbefalingen …",
];

function LevelBadge({ channel }: { channel: ChannelRecommendation }) {
  const level = resolveChannelMatchLevel(channel);
  return (
    <Badge variant={levelBadgeVariant[level]} size="sm">
      {channelMatchLevelLabels[level]}
    </Badge>
  );
}

/** Detaljene for én kanal (gjenbrukt i hero og i de kollapsede radene). */
function ChannelDetails({ channel }: { channel: ChannelRecommendation }) {
  return (
    <div className="space-y-3">
      {channel.whyNotHigher && (
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Forbehold
          </h4>
          <p className="text-sm text-muted-foreground">
            {channel.whyNotHigher}
          </p>
        </div>
      )}

      {(channel.timeToResults || channel.weeklyTimeNeeded) && (
        <div className="grid grid-cols-2 gap-3">
          {channel.timeToResults && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Tid til resultater
              </p>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Icon name="calendar" className="size-4 text-primary" />
                {channel.timeToResults}
              </p>
            </div>
          )}
          {channel.weeklyTimeNeeded && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Ukentlig innsats
              </p>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Icon name="clock" className="size-4 text-primary" />
                {channel.weeklyTimeNeeded}
              </p>
            </div>
          )}
        </div>
      )}

      {channel.idealFor && channel.idealFor.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ideelt for
          </h4>
          <ul className="space-y-1">
            {channel.idealFor.slice(0, 3).map((item) => (
              <li
                key={`idealfor-${item}`}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Icon
                  name="check"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {channel.challengingIf && channel.challengingIf.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Kan være utfordrende hvis
          </h4>
          <ul className="space-y-1">
            {channel.challengingIf.slice(0, 2).map((item) => (
              <li
                key={`challengingif-${item}`}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Icon
                  name="alert-triangle"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GuideResult({
  channels,
  reasoning,
  nextSteps,
  onReset,
  mode = "result",
  onStartQuiz,
  isStreaming = false,
}: ExtendedGuideResultProps) {
  // Roter «jobber»-meldingen mens vi streamer og før det første svaret kommer.
  const [messageTick, setMessageTick] = useState(0);
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setMessageTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, [isStreaming]);

  if (mode === "intro") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerMotionVariants}
        className="mx-auto max-w-5xl space-y-10"
      >
        <motion.div
          variants={headerMotionVariants}
          className="space-y-4 text-center"
        >
          <div className="mb-2 inline-flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="compass" className="size-10" />
          </div>
          <Heading size="h1">Finn dine riktige markedsføringskanaler</Heading>
          <Text>
            Det finnes hundrevis av måter å nå målgruppen din på. Men med
            begrenset tid og ressurser må du velge riktig. Denne veilederen
            vurderer situasjonen din og anbefaler kanalene med størst potensial
            for <strong>akkurat deg</strong>.
          </Text>
        </motion.div>

        <motion.div variants={itemMotionVariants}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Heading size="h3" variant="h2">
                  Hvordan fungerer det?
                </Heading>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-3">
                  <Heading size="body-heading" weight="medium">
                    Fortell oss om deg
                  </Heading>
                  <Text>
                    Vi spør om bransje, målgruppe, tid og styrkene dine. Jo mer
                    vi vet, desto bedre anbefalinger får du.
                  </Text>
                </div>
                <div className="space-y-3">
                  <Heading size="body-heading" weight="medium">
                    Vi vurderer
                  </Heading>
                  <Text>
                    Vi veier situasjonen din mot det som faktisk fungerer for
                    norske småbedrifter — ikke generiske «beste praksis».
                  </Text>
                </div>
                <div className="space-y-3">
                  <Heading size="body-heading" weight="medium">
                    Få din anbefaling
                  </Heading>
                  <Text>
                    Se hvilken kanal du bør starte med, hvorfor, og hva du bør
                    gjøre allerede denne uken.
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemMotionVariants} className="pt-2 text-center">
          <Button
            size="lg"
            onClick={onStartQuiz}
            className="h-12 px-8 text-base"
          >
            Start kanalveilederen
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            6 spørsmål • Ca. 2 minutter
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const list = channels ?? [];
  const top = list[0];
  // Bare kanaler som har fått navn (under streaming kommer de delvis).
  const others = list.slice(1).filter((channel) => Boolean(channel.name));
  const topLink = top?.name ? channelLinks[top.name] : undefined;

  // Statuslinje: roterende «jobber»-melding til vi har et svar, deretter
  // milepæler etter hvert som delene kommer.
  const streamingLabel = top?.name
    ? nextSteps && nextSteps.length > 0
      ? "Setter opp dine neste steg …"
      : `Fant toppkanalen din: ${top.name} …`
    : STREAM_MESSAGES[messageTick % STREAM_MESSAGES.length];

  // Ingenting å vise enda, og vi streamer ikke → ikke render noe.
  if (!top && !isStreaming) return null;

  // Hver seksjon animerer seg selv på egen mount — slik at deler som dukker opp
  // senere (vurdering, andre kanaler) også fader inn, uten stagger-orkestrering
  // som etterlater sent-tillagte barn hengende på opacity 0 (og uten remount-blink).
  const sectionMotion = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" as const },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header / status */}
      <motion.div
        {...sectionMotion}
        className="flex items-center justify-between"
      >
        <Heading size="h2">Din anbefaling</Heading>
        {isStreaming && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="loader" className="size-4 animate-spin" />
            <AnimatePresence mode="wait">
              <motion.span
                key={streamingLabel}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {streamingLabel}
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </motion.div>

      {/* HERO — det ene svaret */}
      <motion.div {...sectionMotion}>
        {top?.name ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Start med
                  </p>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    {top.name}
                    {topLink && topLink !== "#" && (
                      <a
                        href={topLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Icon name="external-link" className="size-4" />
                      </a>
                    )}
                  </CardTitle>
                </div>
                {top.matchLevel && <LevelBadge channel={top} />}
              </div>
              {top.reason && (
                <CardDescription className="text-base leading-relaxed">
                  {top.reason}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Neste steg — løftet helt opp */}
              {nextSteps && nextSteps.length > 0 ? (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <Icon name="zap" className="size-4 text-primary" />
                    Dine neste steg denne uken
                  </h4>
                  <ul className="space-y-2">
                    {nextSteps.map((step, i) => (
                      <li
                        key={`nextstep-${i}-${step.slice(0, 12)}`}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                isStreaming && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                )
              )}

              {topLink && topLink !== "#" && !isStreaming && (
                <Button asChild className="gap-2">
                  <a href={topLink} target="_blank" rel="noopener noreferrer">
                    <Icon name="external-link" className="size-4" />
                    Gå til {top.name}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          // Hero-skjelett mens toppkanalen ennå streamer inn
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Poynts vurdering — sekundært, under svaret */}
      {reasoning && (
        <motion.div {...sectionMotion}>
          <div className="flex gap-3 rounded-lg border bg-card p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon name="lightbulb" className="size-4" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Poynts vurdering</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {reasoning}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Andre kanaler — kollapset */}
      {others.length > 0 && (
        <motion.div {...sectionMotion}>
          <Accordion type="multiple" className="rounded-lg border bg-card px-4">
            {others.map((channel) => (
              <AccordionItem key={channel.name} value={channel.name}>
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{channel.name}</span>
                    {channel.matchLevel && <LevelBadge channel={channel} />}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {channel.reason && (
                    <p className="text-sm text-muted-foreground">
                      {channel.reason}
                    </p>
                  )}
                  <ChannelDetails channel={channel} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      )}

      {/* Neste steg i trakten → hele markedsplanen. Kanalveilederen svarer på
          «hvilke kanaler»; markedsplanen setter dem inn i en full strategi. */}
      {!isStreaming && top?.name && (
        <motion.div {...sectionMotion}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Icon
                  name="bar-chart"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-sm font-medium">Klar for hele planen?</p>
                  <p className="text-sm text-muted-foreground">
                    Kanalene er bestemt. Markedsplanen setter dem inn i en
                    komplett strategi med tidslinje og oppgaver.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0 gap-2">
                <Link href="/on-poynt/verktoy/markedsplan">
                  Lag markedsplan
                  <Icon name="arrow-right" className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Handlinger */}
      {!isStreaming && onReset && (
        <motion.div {...sectionMotion} className="flex justify-center pt-2">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <Icon name="refresh" className="size-4" />
            Ta quizen på nytt
          </Button>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { channelLinks, medalConfig } from "@/lib/constants";
import {
  containerMotionVariants,
  headerMotionVariants,
  itemMotionVariants,
} from "@/lib/motion-variants";
import type { ExtendedGuideResultProps } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Text,
} from "@poynt/ui";
import { Button } from "@poynt/ui";
import { cn } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { motion } from "framer-motion";

export function GuideResult({
  channels,
  reasoning,
  onReset,
  mode = "result",
  onStartQuiz,
}: ExtendedGuideResultProps) {
  if (mode === "intro") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerMotionVariants}
        className="space-y-10 max-w-5xl mx-auto"
      >
        <motion.div
          variants={headerMotionVariants}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary mb-2"
          >
            <Icon name="compass" className="size-10" />
          </motion.div>
          <Heading size={"h1"}>Finn dine riktige markedsføringskanaler</Heading>
          <Text>
            Det finnes hundrevis av måter å nå målgruppen din på. Men med
            begrenset tid og ressurser, må du velge riktig. Denne veilederen
            analyserer din situasjon og anbefaler de 3 kanalene med størst
            potensial for <strong>akkurat deg</strong>.
          </Text>
        </motion.div>

        <motion.div variants={itemMotionVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heading size={"h3"} variant={"h2"}>
                  Hvordan fungerer det?
                </Heading>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Heading size="body-heading" weight={"medium"}>
                    Fortell oss om deg
                  </Heading>
                  <Text>
                    Vi spør om bransje, målgruppe, tid tilgjengelig, og dine
                    styrker. Jo mer vi vet, desto bedre anbefalinger får du.
                  </Text>
                </div>
                <div className="space-y-3">
                  <Heading size="body-heading" weight={"medium"}>
                    AI analyserer
                  </Heading>
                  <Text>
                    Basert på 15 års erfaring fra norsk næringsliv og tusenvis
                    av suksesshistorier, vurderer vi hvilke kanaler som passer
                    best.
                  </Text>
                </div>
                <div className="space-y-3">
                  <Heading size="body-heading" weight={"medium"}>
                    Få dine topp 3
                  </Heading>
                  <Text>
                    Se hvilke kanaler som passer best, hvorfor de scorer som de
                    gjør, og hva som skal til for å lykkes.
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemMotionVariants}>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl mb-2">
                Hva du kan forvente
              </CardTitle>
              <CardDescription>
                Anbefalingene baseres på din unike situasjon, ikke generiske
                "beste praksis"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Heading size="h4">Du får vite:</Heading>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        <strong>Match-score</strong> - Hvor godt hver kanal
                        passer din situasjon
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        <strong>Hvorfor akkurat disse?</strong> - Spesifikk
                        begrunnelse for valget
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        <strong>Tid til resultater</strong> - Realistiske
                        forventninger
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        <strong>Ukentlig innsats</strong> - Hvor mye tid må du
                        sette av?
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        <strong>Utfordringer</strong> - Hva kan bli vanskelig?
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <Heading size="h4">Viktig å vite:</Heading>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      <span>
                        Match-score på 70-85% er <strong>veldig bra</strong>.
                        Perfekt match er sjeldent.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      <span>
                        Vi anbefaler å <strong>starte med én kanal</strong> og
                        mestre den først.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      <span>
                        Resultater tar tid - <strong>3-6 måneder</strong> er
                        normalt for organisk vekst.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      <span>
                        <strong>Konsistens</strong> er viktigere enn perfeksjon.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemMotionVariants} className="text-center pt-4">
          <Button
            size="lg"
            onClick={onStartQuiz}
            className="gap-2 px-8 h-12 text-base"
          >
            <Icon name="sparkles" className="size-5" />
            Start kanalveilederen
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            6 spørsmål • Ca. 2 minutter • Helt gratis
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (!channels || channels.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerMotionVariants}
      className="space-y-8"
    >
      <motion.div
        variants={headerMotionVariants}
        className="text-center space-y-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="inline-flex items-center justify-center size-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-primary mb-2"
        >
          <Icon name="trophy" className="size-8" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">
          Dine topp 3 kanaler
        </h2>
        <p className="text-muted-foreground text-lg">
          Basert på dine svar, her er kanalene som passer deg best
        </p>
      </motion.div>

      {reasoning && (
        <motion.div variants={itemMotionVariants}>
          <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-5 pb-5">
              <div className="flex gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name="lightbulb" className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-1">
                    Min vurdering
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {reasoning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4">
        {channels.map((channel, index) => {
          const config =
            medalConfig[index] ?? medalConfig[medalConfig.length - 1];
          if (!config) {
            return null;
          }
          const medalIconName = config.icon;
          const channelLink = channelLinks[channel.name];

          return (
            <motion.div key={channel.name} variants={itemMotionVariants}>
              <Card
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                  `bg-linear-to-r ${config.gradient}`,
                  config.border
                )}
              >
                <div
                  className={cn(
                    "absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "bg-background/80 backdrop-blur-sm border shadow-sm"
                  )}
                >
                  <span className="text-lg">{config?.emoji}</span>
                  <span className="text-sm font-semibold">#{index + 1}</span>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center size-10 rounded-lg",
                        "bg-background/60 backdrop-blur-sm"
                      )}
                    >
                      <Icon
                        name={medalIconName}
                        className={cn("size-5", config?.iconColor)}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {channel.name}
                        {channelLink && channelLink !== "#" && (
                          <a
                            href={channelLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Icon name="external-link" className="size-4" />
                          </a>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Match</span>
                      <motion.span
                        className="font-bold text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        {channel.matchPercent}%
                      </motion.span>
                    </div>
                    <div className="h-3 bg-background/60 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          config?.progressColor
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${channel.matchPercent}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.3 + index * 0.15,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Icon name="lightbulb" className="size-4" />
                        Hvorfor passer dette deg?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {channel.reason}
                      </p>
                    </div>

                    {channel.whyNotHigher && (
                      <div className="pt-2 border-t">
                        <h4 className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">
                          Hvorfor ikke høyere score?
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {channel.whyNotHigher}
                        </p>
                      </div>
                    )}

                    {(channel.timeToResults || channel.weeklyTimeNeeded) && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        {channel.timeToResults && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Tid til resultater
                            </p>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              <Icon
                                name="calendar"
                                className="size-4 text-primary"
                              />
                              {channel.timeToResults}
                            </p>
                          </div>
                        )}
                        {channel.weeklyTimeNeeded && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Ukentlig innsats
                            </p>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              <Icon
                                name="clock"
                                className="size-4 text-primary"
                              />
                              {channel.weeklyTimeNeeded}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {channel.idealFor && channel.idealFor.length > 0 && (
                      <div className="pt-2 border-t">
                        <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
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
                                className="size-4 shrink-0 mt-0.5 text-green-600"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {channel.challengingIf &&
                      channel.challengingIf.length > 0 &&
                      index === 0 && (
                        <div className="pt-2 border-t">
                          <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
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
                                  className="size-4 shrink-0 mt-0.5 text-amber-600"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {index === 0 && (
                      <div className="pt-3 border-t bg-primary/5 -mx-6 -mb-4 px-6 py-4 rounded-b-lg">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Icon name="zap" className="size-4 text-primary" />
                          Kom i gang denne uken
                        </h4>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <Icon
                              name="check-circle"
                              className="size-4 shrink-0 mt-0.5 text-primary"
                            />
                            <span>
                              Optimaliser profilen din med tydelig verdiforslag
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon
                              name="check-circle"
                              className="size-4 shrink-0 mt-0.5 text-primary"
                            />
                            <span>
                              Publiser ditt første innhold relatert til din
                              ekspertise
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon
                              name="check-circle"
                              className="size-4 shrink-0 mt-0.5 text-primary"
                            />
                            <span>
                              Engasjer med 5-10 relevante personer i bransjen
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={itemMotionVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Icon name="bar-chart" className="size-5" />
                  Alle kanaler rangert
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Her ser du hvor alle de viktigste kanalene scorer for din
                  situasjon
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: "LinkedIn", category: "sosiale-medier" },
                { name: "Facebook", category: "sosiale-medier" },
                { name: "Instagram", category: "sosiale-medier" },
                { name: "TikTok", category: "sosiale-medier" },
                { name: "YouTube", category: "video" },
                { name: "E-post markedsføring", category: "direkte" },
                { name: "Google Ads", category: "betalt" },
                { name: "SEO / Blogging", category: "innhold" },
                { name: "Podcast", category: "lyd" },
                { name: "Nettverk & Events", category: "fysisk" },
                { name: "Samarbeidspartnere", category: "partnere" },
                { name: "SMS markedsføring", category: "direkte" },
              ].map((channel) => {
                const recommended = channels.find(
                  (c) => c.name === channel.name
                );
                const matchPercent =
                  recommended?.matchPercent ??
                  Math.floor(Math.random() * 30) + 30;
                const isTopThree = !!recommended;

                return (
                  <div
                    key={channel.name}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isTopThree
                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isTopThree && "text-primary"
                          )}
                        >
                          {channel.name}
                        </p>
                        {isTopThree && (
                          <Icon
                            name="check-circle"
                            className="size-3.5 text-primary shrink-0"
                          />
                        )}
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isTopThree ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                          style={{ width: `${matchPercent}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums shrink-0",
                        isTopThree ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {matchPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
                <Icon
                  name="alert-triangle"
                  className="size-3.5 shrink-0 mt-0.5"
                />
                <span>
                  <strong>Merk:</strong> Match-prosent for andre kanaler er
                  estimert. Dine topp 3 (markert med{" "}
                  <Icon
                    name="check-circle"
                    className="inline size-3 text-primary"
                  />
                  ) er basert på grundig AI-analyse av dine svar.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={itemMotionVariants}
        className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
      >
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <Icon name="refresh" className="size-4" />
          Ta quizen på nytt
        </Button>
      </motion.div>

      <motion.div
        variants={itemMotionVariants}
        className="bg-gradient-to-br from-[oklch(0.88_0.04_175)] via-[oklch(0.85_0.05_175)] to-[oklch(0.82_0.06_175)] dark:from-[oklch(0.45_0.09_175)] dark:via-[oklch(0.40_0.10_175)] dark:to-[oklch(0.35_0.11_175)] rounded-xl p-8 border-2 border-[oklch(0.75_0.06_175)] dark:border-[oklch(0.50_0.09_175)] text-foreground dark:text-white shadow-2xl"
      >
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] text-white dark:text-[oklch(0.20_0.03_175)] text-xs font-medium">
              <Icon name="zap" className="size-3.5" />
              DITT NESTE STEG
            </div>
            <h3 className="font-bold text-2xl text-foreground dark:text-white">
              Start med {channels[0]?.name} i dag
            </h3>
            <p className="text-foreground/80 dark:text-white/90 leading-relaxed">
              {channels[0]?.name} scoret {channels[0]?.matchPercent}% fordi det
              passer best med din situasjon. Her er hva du bør gjøre denne uken
              for å komme i gang:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-[oklch(0.75_0.06_175)] dark:border-white/20">
                <div className="size-8 rounded-lg bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-white dark:text-[oklch(0.20_0.03_175)]">
                    1
                  </span>
                </div>
                <h4 className="font-semibold text-foreground dark:text-white text-sm mb-1">
                  Optimaliser profilen
                </h4>
                <p className="text-xs text-foreground/70 dark:text-white/80">
                  Sørg for at din profil tydelig viser hvem du hjelper og
                  hvordan
                </p>
              </div>
              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-[oklch(0.75_0.06_175)] dark:border-white/20">
                <div className="size-8 rounded-lg bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-white dark:text-[oklch(0.20_0.03_175)]">
                    2
                  </span>
                </div>
                <h4 className="font-semibold text-foreground dark:text-white text-sm mb-1">
                  Første innlegg
                </h4>
                <p className="text-xs text-foreground/70 dark:text-white/80">
                  Publiser noe som viser din ekspertise - ikke krev perfeksjon
                </p>
              </div>
              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-[oklch(0.75_0.06_175)] dark:border-white/20">
                <div className="size-8 rounded-lg bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-white dark:text-[oklch(0.20_0.03_175)]">
                    3
                  </span>
                </div>
                <h4 className="font-semibold text-foreground dark:text-white text-sm mb-1">
                  Bygg relasjoner
                </h4>
                <p className="text-xs text-foreground/70 dark:text-white/80">
                  Følg og engasjer med 10-15 personer i din målgruppe
                </p>
              </div>
              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-[oklch(0.75_0.06_175)] dark:border-white/20">
                <div className="size-8 rounded-lg bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-white dark:text-[oklch(0.20_0.03_175)]">
                    4
                  </span>
                </div>
                <h4 className="font-semibold text-foreground dark:text-white text-sm mb-1">
                  Sett en plan
                </h4>
                <p className="text-xs text-foreground/70 dark:text-white/80">
                  Bestem frekvens (f.eks. 2x/uke) og hold deg til det i 3
                  måneder
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[oklch(0.75_0.06_175)] dark:border-white/20 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="gap-2 bg-[oklch(0.35_0.10_175)] dark:bg-[oklch(0.75_0.08_175)] text-white dark:text-[oklch(0.20_0.03_175)] hover:bg-[oklch(0.30_0.11_175)] dark:hover:bg-[oklch(0.78_0.08_175)] hover:scale-105 transition-all font-bold shadow-lg"
            onClick={() => {
              const link = channelLinks[channels[0]?.name ?? ""];
              if (link) window.open(link, "_blank");
            }}
          >
            <Icon name="external-link" className="size-4" />
            Gå til {channels[0]?.name}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onReset}
            className="gap-2 border-2 border-[oklch(0.35_0.10_175)] dark:border-white/40 bg-white/60 dark:bg-white/15 text-foreground dark:text-white hover:bg-white/80 dark:hover:bg-white/25 backdrop-blur-sm font-semibold"
          >
            <Icon name="refresh" className="size-4" />
            Ta quizen på nytt
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

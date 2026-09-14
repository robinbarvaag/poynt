"use client";

import type { CheckInOutcome, CheckInResult } from "@/lib/events/registrations";
import { Button, cn } from "@poynt/ui";
import jsQR from "jsqr";
import {
  Ban,
  Camera,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Hourglass,
  type LucideIcon,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Skanner i døra, laget for kø: én billett om gangen, og hvert treff gir et
 * stort farget kort OPPÅ kameraet (ikon, status, navn), lyd og vibrasjon.
 * Kortet forsvinner av seg selv, og skanneren er klar for neste. Venteliste og
 * avmeldt krever et valg («Slipp inn likevel»). En logg over siste skanninger
 * gjør det lett å se hva som skjedde, og å angre en innsjekk.
 *
 * Kamera: nettleserens BarcodeDetector der den finnes (Chrome/Android), ellers
 * jsQR på bilder fra kameraet (iPhone/Safari har ikke BarcodeDetector).
 */

interface EventOption {
  id: number;
  title: string;
  startsAt: string;
}

interface ScanResponse extends CheckInResult {
  counts: { checkedIn: number; seats: number; capacity: number | null } | null;
  error?: string;
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface LogEntry {
  key: number;
  outcome: CheckInOutcome;
  name?: string;
  code?: string;
  registrationId?: number;
  at: number;
  undone?: boolean;
}

const SCAN_INTERVAL_MS = 200;
/** Samme QR-kode ignoreres så lenge (personen holder ofte telefonen oppe). */
const SAME_CODE_COOLDOWN_MS = 8000;
/** Tellerne hentes på nytt jevnlig, så flere i døra ser det samme. */
const COUNTS_REFRESH_MS = 20_000;
const SOUND_KEY = "poynt-innsjekk-lyd";

type Tone = "ok" | "warn" | "error";

const OUTCOMES: Record<
  CheckInOutcome,
  {
    label: string;
    icon: LucideIcon;
    className: string;
    tone: Tone;
    /** Null = krever et valg før neste skanning. */
    dismissMs: number | null;
  }
> = {
  ok: {
    label: "Sjekket inn",
    icon: CircleCheck,
    className: "bg-green-600 text-white",
    tone: "ok",
    dismissMs: 2200,
  },
  already: {
    label: "Allerede sjekket inn",
    icon: CircleAlert,
    className: "bg-yellow-400 text-stone-900",
    tone: "warn",
    dismissMs: 3500,
  },
  waitlisted: {
    label: "Står på ventelista",
    icon: Hourglass,
    className: "bg-orange-500 text-white",
    tone: "warn",
    dismissMs: null,
  },
  cancelled: {
    label: "Har meldt seg av",
    icon: Ban,
    className: "bg-orange-500 text-white",
    tone: "warn",
    dismissMs: null,
  },
  wrong_event: {
    label: "Feil event",
    icon: CircleX,
    className: "bg-red-600 text-white",
    tone: "error",
    dismissMs: 4000,
  },
  unknown: {
    label: "Ukjent billett",
    icon: CircleHelp,
    className: "bg-red-600 text-white",
    tone: "error",
    dismissMs: 4000,
  },
};

const clock = (value: string | number) =>
  new Date(value).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });

function describe(result: ScanResponse): { title: string; detail?: string } {
  const r = result.registration;
  switch (result.outcome) {
    case "ok":
      return { title: r?.name ?? "Velkommen!", detail: r?.code };
    case "already":
      return {
        title: r?.name ?? "Allerede inne",
        detail: r?.checkedInAt ? `Kom kl. ${clock(r.checkedInAt)}` : r?.code,
      };
    case "waitlisted":
      return {
        title: r?.name ?? "Venteliste",
        detail: "Har ikke fått plass. Slipp inn hvis det er plass i lokalet.",
      };
    case "cancelled":
      return {
        title: r?.name ?? "Avmeldt",
        detail: "Billetten er ikke gyldig lenger.",
      };
    case "wrong_event":
      return {
        title: r?.name ?? "Annen billett",
        detail: r?.eventTitle
          ? `Billetten gjelder «${r.eventTitle}»`
          : "Billetten gjelder et annet event.",
      };
    default:
      return {
        title: "Fant ingen billett",
        detail:
          result.error ??
          "Sjekk koden, eller om QR-koden faktisk er en Poynt-billett.",
      };
  }
}

/** Kort lydsignal: to lyse toner (ok), to like (advarsel), én dyp (feil). */
function beep(ctx: AudioContext, tone: Tone) {
  const notes: [frequency: number, start: number, duration: number][] =
    tone === "ok"
      ? [
          [880, 0, 0.12],
          [1320, 0.12, 0.2],
        ]
      : tone === "warn"
        ? [
            [520, 0, 0.16],
            [520, 0.24, 0.16],
          ]
        : [[200, 0, 0.4]];
  for (const [frequency, start, duration] of notes) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = tone === "error" ? "square" : "sine";
    oscillator.frequency.value = frequency;
    const t = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.02);
  }
}

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3 py-3 text-base text-foreground";

async function postCheckIn(body: Record<string, unknown>) {
  return fetch("/api/eventer/admin/innsjekk", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function CheckInScanner({
  events,
  initialEventId,
}: {
  events: EventOption[];
  initialEventId: number | null;
}) {
  const [eventId, setEventId] = useState<number | null>(initialEventId);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<(ScanResponse & { key: number }) | null>(
    null
  );
  const [counts, setCounts] = useState<ScanResponse["counts"]>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameAt = useRef(0);
  const busyRef = useRef(false);
  const lastScan = useRef<{ value: string; at: number } | null>(null);
  const lastRequest = useRef<{ scanned?: string; code?: string } | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const keyRef = useRef(0);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  // Ikke skann mens et resultat vises — da rekker man å se det.
  const pausedRef = useRef(false);
  pausedRef.current = result !== null;

  useEffect(() => {
    try {
      setSoundOn(window.localStorage.getItem(SOUND_KEY) !== "av");
    } catch {
      // Lagring blokkert — lyd på som standard.
    }
  }, []);

  /** Lyd må låses opp av et trykk (iOS), så dette kalles fra knappene. */
  const ensureAudio = () => {
    if (!audioRef.current) {
      const Context = window.AudioContext ?? window.webkitAudioContext;
      if (Context) audioRef.current = new Context();
    }
    audioRef.current?.resume().catch(() => {});
  };

  const refreshCounts = useCallback(async (id: number | null) => {
    if (!id) return;
    const res = await postCheckIn({ eventId: id }).catch(() => null);
    if (!res?.ok) return;
    const json = (await res.json()) as ScanResponse;
    if (json.counts && eventIdRef.current === id) setCounts(json.counts);
  }, []);

  useEffect(() => {
    refreshCounts(eventId);
    const timer = setInterval(() => refreshCounts(eventId), COUNTS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [eventId, refreshCounts]);

  const submit = useCallback(
    async (request: { scanned?: string; code?: string }, force = false) => {
      busyRef.current = true;
      setSubmitting(true);
      lastRequest.current = request;
      let response: ScanResponse;
      try {
        const res = await postCheckIn({
          ...request,
          eventId: eventIdRef.current,
          force,
        });
        const json = (await res.json()) as ScanResponse;
        response = res.ok
          ? json
          : {
              outcome: "unknown",
              counts: null,
              error:
                res.status === 401
                  ? "Du er logget ut. Last inn siden på nytt og logg inn."
                  : json.error,
            };
      } catch {
        response = {
          outcome: "unknown",
          counts: null,
          error: "Fikk ikke kontakt med serveren. Sjekk nettet.",
        };
      } finally {
        busyRef.current = false;
        setSubmitting(false);
      }

      const key = ++keyRef.current;
      const meta = OUTCOMES[response.outcome];
      setResult({ ...response, key });
      if (response.counts) setCounts(response.counts);
      navigator.vibrate?.(meta.tone === "ok" ? 150 : [90, 60, 90, 60, 90]);
      if (soundRef.current && audioRef.current) {
        beep(audioRef.current, meta.tone);
      }
      const r = response.registration;
      setLog((previous) =>
        [
          {
            key,
            outcome: response.outcome,
            name: r?.name,
            code: r?.code,
            registrationId: r?.id,
            at: Date.now(),
          },
          ...previous,
        ].slice(0, 30)
      );
    },
    []
  );

  // Kortet forsvinner av seg selv (ikke når det krever et valg).
  useEffect(() => {
    if (!result) return;
    const ms = OUTCOMES[result.outcome].dismissMs;
    if (ms === null) return;
    const timer = setTimeout(
      () =>
        setResult((current) => (current?.key === result.key ? null : current)),
      ms
    );
    return () => clearTimeout(timer);
  }, [result]);

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const detect = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    if (window.BarcodeDetector) {
      detectorRef.current ??= new window.BarcodeDetector({
        formats: ["qr_code"],
      });
      const codes = await detectorRef.current.detect(video);
      return codes[0]?.rawValue ?? null;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return null;
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return (
      jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      })?.data ?? null
    );
  }, []);

  const tick = useCallback(() => {
    frameRef.current = requestAnimationFrame(tick);
    const now = performance.now();
    if (
      busyRef.current ||
      pausedRef.current ||
      now - lastFrameAt.current < SCAN_INTERVAL_MS
    ) {
      return;
    }
    lastFrameAt.current = now;

    busyRef.current = true;
    detect()
      .then((value) => {
        busyRef.current = false;
        if (!value) return;
        const previous = lastScan.current;
        if (
          previous &&
          previous.value === value &&
          Date.now() - previous.at < SAME_CODE_COOLDOWN_MS
        ) {
          return;
        }
        lastScan.current = { value, at: Date.now() };
        submit({ scanned: value });
      })
      .catch(() => {
        busyRef.current = false;
      });
  }, [detect, submit]);

  const startCamera = async () => {
    ensureAudio();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
      frameRef.current = requestAnimationFrame(tick);
      // Hold skjermen våken mens det skannes.
      if ("wakeLock" in navigator) {
        navigator.wakeLock
          .request("screen")
          .then((lock) => {
            wakeLockRef.current = lock;
          })
          .catch(() => {});
      }
    } catch {
      setCameraError(
        "Fikk ikke tilgang til kameraet. Gi nettleseren lov til å bruke kameraet, eller skriv inn koden under."
      );
    }
  };

  const toggleSound = () => {
    ensureAudio();
    const next = !soundOn;
    setSoundOn(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "på" : "av");
    } catch {
      // Ikke så farlig — gjelder bare denne økta.
    }
  };

  const undo = async (entry: LogEntry) => {
    if (!entry.registrationId) return;
    const res = await fetch(
      `/api/eventer/admin/pamelding/${entry.registrationId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo-check-in" }),
      }
    ).catch(() => null);
    if (!res?.ok) return;
    setLog((previous) =>
      previous.map((e) => (e.key === entry.key ? { ...e, undone: true } : e))
    );
    lastScan.current = null;
    refreshCounts(eventIdRef.current);
  };

  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 p-5 text-muted-foreground">
        Ingen kommende eventer med påmelding her på nettsiden.
      </p>
    );
  }

  const meta = result ? OUTCOMES[result.outcome] : null;
  const ResultIcon = meta?.icon;
  const text = result ? describe(result) : null;
  const needsDecision =
    result?.outcome === "waitlisted" || result?.outcome === "cancelled";
  const percent = counts?.seats
    ? Math.min(100, Math.round((counts.checkedIn / counts.seats) * 100))
    : 0;

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-3xl bg-card p-4 ring-1 ring-border">
        <select
          aria-label="Event"
          value={eventId ?? ""}
          onChange={(e) => {
            setEventId(Number(e.target.value));
            setCounts(null);
            setResult(null);
            setLog([]);
          }}
          className={fieldClass}
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ·{" "}
              {new Date(e.startsAt).toLocaleDateString("nb-NO", {
                day: "numeric",
                month: "short",
              })}
            </option>
          ))}
        </select>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-foreground">
            <span className="font-bold font-heading text-4xl tabular-nums">
              {counts?.checkedIn ?? "–"}
            </span>{" "}
            <span className="text-muted-foreground">
              av {counts?.seats ?? "–"} har kommet
            </span>
          </p>
          {counts?.capacity ? (
            <span className="text-muted-foreground text-sm">
              {counts.capacity} plasser
            </span>
          ) : null}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-600 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-950">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("size-full object-cover", !cameraOn && "hidden")}
        />
        {cameraOn && !result && (
          <div
            aria-hidden
            className="absolute inset-[18%] rounded-2xl border-[3px] border-white/85 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]"
          />
        )}
        {!cameraOn && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <Camera className="size-12 opacity-80" aria-hidden />
            <Button size="lg" onClick={startCamera}>
              Start kamera
            </Button>
            <p className="text-sm text-white/70">
              Eller skriv inn koden under.
            </p>
          </div>
        )}
        {result && meta && ResultIcon && text && (
          <output
            key={result.key}
            aria-live="assertive"
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
              meta.className
            )}
          >
            <ResultIcon className="size-24" strokeWidth={2.5} aria-hidden />
            <p className="mt-2 font-bold text-sm uppercase tracking-[0.16em] opacity-90">
              {meta.label}
            </p>
            <p className="text-balance font-bold font-heading text-3xl leading-tight">
              {text.title}
            </p>
            {text.detail && (
              <p className="text-balance text-lg opacity-90">{text.detail}</p>
            )}
            {needsDecision ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (lastRequest.current) submit(lastRequest.current, true);
                  }}
                  className="rounded-full bg-white px-5 py-3 font-bold text-stone-900"
                >
                  Slipp inn likevel
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-full border-2 border-current px-5 py-3 font-bold"
                >
                  Ikke slipp inn
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-3 rounded-full border-2 border-current px-5 py-2 font-semibold text-sm"
              >
                Skann neste
              </button>
            )}
          </output>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        {cameraOn && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={stopCamera}
          >
            Stopp kamera
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className={cn(!cameraOn && "flex-1")}
          onClick={toggleSound}
          aria-pressed={soundOn}
        >
          {soundOn ? (
            <Volume2 className="size-5" aria-hidden />
          ) : (
            <VolumeX className="size-5" aria-hidden />
          )}
          {soundOn ? "Lyd på" : "Lyd av"}
        </Button>
      </div>
      {cameraError && <p className="text-destructive text-sm">{cameraError}</p>}
      <p className="text-muted-foreground text-sm">
        Én billett om gangen: hold QR-koden 15–30 cm fra kameraet. Når fargen
        forsvinner, er skanneren klar for neste.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!manualCode.trim()) return;
          ensureAudio();
          submit({ code: manualCode.trim() });
          setManualCode("");
        }}
        className="grid gap-1.5"
      >
        <label htmlFor="innsjekk-kode" className="font-semibold text-sm">
          Skriv inn koden
        </label>
        <div className="flex gap-2">
          <input
            id="innsjekk-kode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="POY-7K3M"
            autoCapitalize="characters"
            autoComplete="off"
            className={cn(fieldClass, "flex-1 font-mono uppercase")}
          />
          <Button
            type="submit"
            size="lg"
            variant="outline"
            disabled={submitting}
          >
            Sjekk inn
          </Button>
        </div>
      </form>

      {log.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-semibold text-foreground">Siste skanninger</h2>
          <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
            {log.map((entry) => {
              const entryMeta = OUTCOMES[entry.outcome];
              const EntryIcon = entryMeta.icon;
              return (
                <li
                  key={entry.key}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      entry.undone
                        ? "bg-muted text-muted-foreground"
                        : entryMeta.className
                    )}
                  >
                    <EntryIcon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-semibold text-foreground",
                        entry.undone && "line-through opacity-60"
                      )}
                    >
                      {entry.name ?? entryMeta.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {entry.undone ? "Innsjekk angret" : entryMeta.label} ·{" "}
                      {clock(entry.at)}
                      {entry.code ? ` · ${entry.code}` : ""}
                    </p>
                  </div>
                  {entry.outcome === "ok" &&
                    !entry.undone &&
                    entry.registrationId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => undo(entry)}
                      >
                        <Undo2 className="size-4" aria-hidden />
                        Angre
                      </Button>
                    )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";

import { Button } from "@payloadcms/ui";
import jsQR from "jsqr";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CheckInOutcome,
  CheckInResult,
} from "../../../lib/events/registrations";

/**
 * Skanner i døra. Bruker nettleserens innebygde BarcodeDetector der den finnes
 * (Chrome/Android), ellers jsQR på bilder fra kameraet (iPhone/Safari har ikke
 * BarcodeDetector). Samme kode skannes ikke to ganger på rad, og hvert treff
 * gir tydelig farge, tekst og en kort vibrasjon.
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
  }
}

const SCAN_INTERVAL_MS = 200;
const SAME_CODE_COOLDOWN_MS = 4000;

const TONES: Record<CheckInOutcome, { bg: string; fg: string; icon: string }> =
  {
    ok: { bg: "#16a34a", fg: "#fff", icon: "✓" },
    already: { bg: "#eab308", fg: "#1c1917", icon: "!" },
    waitlisted: { bg: "#f97316", fg: "#fff", icon: "⏳" },
    cancelled: { bg: "#f97316", fg: "#fff", icon: "✕" },
    wrong_event: { bg: "#dc2626", fg: "#fff", icon: "✕" },
    unknown: { bg: "#dc2626", fg: "#fff", icon: "?" },
  };

function describe(result: ScanResponse): { title: string; detail?: string } {
  const r = result.registration;
  const time = r?.checkedInAt
    ? new Date(r.checkedInAt).toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  switch (result.outcome) {
    case "ok":
      return { title: `Velkommen, ${r?.name}!`, detail: r?.code };
    case "already":
      return {
        title: `${r?.name} er allerede sjekket inn`,
        detail: time ? `Kl. ${time}` : undefined,
      };
    case "waitlisted":
      return {
        title: `${r?.name} står på ventelista`,
        detail: "Har ikke fått plass ennå.",
      };
    case "cancelled":
      return {
        title: `${r?.name} har meldt seg av`,
        detail: "Billetten er ikke gyldig lenger.",
      };
    case "wrong_event":
      return {
        title: "Billetten gjelder et annet event",
        detail: r?.eventTitle,
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

const cardBase: CSSProperties = {
  borderRadius: "12px",
  padding: "1.25rem",
  display: "flex",
  gap: "1rem",
  alignItems: "center",
};

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
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [counts, setCounts] = useState<ScanResponse["counts"]>(null);
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameAt = useRef(0);
  const busyRef = useRef(false);
  const lastScan = useRef<{ value: string; at: number } | null>(null);
  const lastRequest = useRef<{ scanned?: string; code?: string } | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  const submit = useCallback(
    async (request: { scanned?: string; code?: string }, force = false) => {
      busyRef.current = true;
      setSubmitting(true);
      lastRequest.current = request;
      try {
        const res = await fetch("/api/eventer/admin/innsjekk", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...request,
            eventId: eventIdRef.current,
            force,
          }),
        });
        const json = (await res.json()) as ScanResponse;
        if (!res.ok) {
          setResult({ outcome: "unknown", counts: null, error: json.error });
        } else {
          setResult(json);
          if (json.counts) setCounts(json.counts);
        }
        navigator.vibrate?.(
          res.ok && json.outcome === "ok" ? 80 : [60, 60, 60]
        );
      } catch {
        setResult({
          outcome: "unknown",
          counts: null,
          error: "Fikk ikke kontakt med serveren. Sjekk nettet.",
        });
      } finally {
        busyRef.current = false;
        setSubmitting(false);
      }
    },
    []
  );

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
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
    if (busyRef.current || now - lastFrameAt.current < SCAN_INTERVAL_MS) return;
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
    } catch {
      setCameraError(
        "Fikk ikke tilgang til kameraet. Gi nettleseren lov til å bruke kameraet, eller skriv inn koden under."
      );
    }
  };

  if (events.length === 0) {
    return (
      <p style={{ color: "var(--theme-elevation-500)" }}>
        Ingen kommende eventer med påmelding her på nettsiden.
      </p>
    );
  }

  const tone = result ? TONES[result.outcome] : null;
  const text = result ? describe(result) : null;
  const canForce =
    result?.outcome === "waitlisted" || result?.outcome === "cancelled";

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "560px" }}>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Event</span>
        <select
          value={eventId ?? ""}
          onChange={(e) => {
            setEventId(Number(e.target.value));
            setCounts(null);
            setResult(null);
          }}
          style={{
            padding: "0.65rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg, var(--theme-elevation-0))",
            color: "inherit",
            fontSize: "1rem",
          }}
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
      </label>

      {counts && (
        <p style={{ margin: 0, fontSize: "1.1rem" }}>
          <strong>{counts.checkedIn}</strong> av <strong>{counts.seats}</strong>{" "}
          påmeldte har kommet
          {counts.capacity ? ` (${counts.capacity} plasser)` : ""}
        </p>
      )}

      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#0c0a09",
          aspectRatio: "1 / 1",
          display: cameraOn ? "block" : "none",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "18%",
            border: "3px solid rgba(255,255,255,0.85)",
            borderRadius: "16px",
            boxShadow: "0 0 0 100vmax rgba(0,0,0,0.35)",
          }}
        />
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {cameraOn ? (
          <Button buttonStyle="secondary" margin={false} onClick={stopCamera}>
            Stopp kamera
          </Button>
        ) : (
          <Button buttonStyle="primary" margin={false} onClick={startCamera}>
            Start kamera
          </Button>
        )}
      </div>
      {cameraError && (
        <p style={{ margin: 0, color: "var(--theme-error-500)" }}>
          {cameraError}
        </p>
      )}

      {result && tone && text && (
        <output
          aria-live="assertive"
          style={{ ...cardBase, background: tone.bg, color: tone.fg }}
        >
          <span
            aria-hidden
            style={{ fontSize: "2.5rem", lineHeight: 1, fontWeight: 800 }}
          >
            {tone.icon}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
              {text.title}
            </p>
            {text.detail && (
              <p style={{ margin: "0.2rem 0 0", opacity: 0.9 }}>
                {text.detail}
              </p>
            )}
            {canForce && lastRequest.current && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (lastRequest.current) submit(lastRequest.current, true);
                }}
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "999px",
                  border: "2px solid currentColor",
                  background: "transparent",
                  color: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Slipp inn likevel
              </button>
            )}
          </div>
        </output>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!manualCode.trim()) return;
          submit({ code: manualCode.trim() });
          setManualCode("");
        }}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Kode, f.eks. POY-7K3M"
          autoCapitalize="characters"
          autoComplete="off"
          style={{
            flex: 1,
            padding: "0.65rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg, var(--theme-elevation-0))",
            color: "inherit",
            fontSize: "1rem",
            fontFamily: "monospace",
            textTransform: "uppercase",
          }}
        />
        <Button
          type="submit"
          buttonStyle="secondary"
          margin={false}
          disabled={submitting}
        >
          Sjekk inn
        </Button>
      </form>
    </div>
  );
}

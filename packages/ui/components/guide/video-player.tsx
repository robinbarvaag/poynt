"use client";

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/utils";
import { Reveal } from "../motion/reveal";

export interface VideoPlayerProps {
  /** Direkte URL til videofila (selv-hostet, f.eks. Payload-media). */
  src: string;
  /** Plakatbilde som vises før avspilling starter. */
  poster?: string;
  /** Redaksjonell bildetekst under videoen. */
  caption?: string;
  /** Spill av automatisk når videoen kommer i visning (krever `muted`). */
  autoPlay?: boolean;
  /** Spill av på nytt når videoen er ferdig. */
  loop?: boolean;
  /** Start uten lyd. Nødvendig for at autoplay skal funke i nettlesere. */
  muted?: boolean;
  /** Vis våre egne kontroller. Av = stille bakgrunns-/loop-video uten UI. */
  controls?: boolean;
  className?: string;
}

/** Sekunder → «m:ss», eller «–:––» når lengden ikke er kjent ennå. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "–:––";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Selv-hostet video med HTML5-`<video>` uten native kontroller, og våre egne
 * kontroller (spill/pause, søkelinje, lyd, fullskjerm) lagt oppå i squircle-
 * rammen. Autoplay skjer først når videoen er i visning (IntersectionObserver),
 * som både respekterer nettlesernes autoplay-regler og sparer båndbredde.
 *
 * Med `controls={false}` vises ingen UI — da er det en stille loop-/bakgrunns-
 * video (typisk autoplay + muted + loop).
 */
export function VideoPlayer({
  src,
  poster,
  caption,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted || autoPlay);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Kontrollene synes ved hover/pause; skjules under uavbrutt avspilling.
  const [hovering, setHovering] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void frame.requestFullscreen();
    }
  }, []);

  // Søk i videoen ut fra hvor på sporet man klikker/drar.
  const seekTo = useCallback(
    (clientX: number, track: HTMLElement) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(
        Math.max((clientX - rect.left) / rect.width, 0),
        1
      );
      video.currentTime = ratio * duration;
      setCurrent(video.currentTime);
    },
    [duration]
  );

  const onTrackPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const track = e.currentTarget;
      track.setPointerCapture(e.pointerId);
      seekTo(e.clientX, track);
    },
    [seekTo]
  );

  const onTrackPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        seekTo(e.clientX, e.currentTarget);
      }
    },
    [seekTo]
  );

  // Spill av / pause automatisk ut fra om videoen er i visning.
  useEffect(() => {
    const video = videoRef.current;
    if (!(video && autoPlay)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => {
            /* autoplay kan blokkeres – stille feil */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  // Speil fullskjerm-status (kan endres via Esc/nettleser-UI).
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Les lengden robust. `onLoadedMetadata` kan ha fyrt før React rakk å henge
  // på lytteren (cachet metadata) → da ble lengden hengende på 0. Vi leser den
  // direkte ved montering og lytter på både loadedmetadata og durationchange.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      if (Number.isFinite(video.duration)) setDuration(video.duration);
    };
    sync();
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("durationchange", sync);
    return () => {
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("durationchange", sync);
    };
  }, []);

  // Kontroll-linja skjules i ro (da vises kun den store spill-knappen) og glir
  // inn når musa er over rammen eller videoen spiller av.
  const showBar = controls && (hovering || playing);
  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <Reveal className={cn("flex flex-col gap-3", className)}>
      <div
        ref={frameRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group relative aspect-video overflow-hidden rounded-2xl bg-foreground ring-1 ring-foreground/10"
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: tastaturstyring dekkes av den synlige spill/pause-knappen */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          loop={loop}
          muted={muted || autoPlay}
          playsInline
          preload="metadata"
          // Klikk på selve videoen = spill/pause (men ikke i kontroll-løs modus).
          onClick={controls ? togglePlay : undefined}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          className={cn(
            "h-full w-full object-contain",
            controls && "cursor-pointer"
          )}
        />

        {/* Stor spill-knapp midt på når den står i pause. */}
        {controls && !playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Spill av"
            className="absolute inset-0 grid place-items-center"
          >
            <span className="grid size-16 place-items-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur transition-transform duration-200 group-hover:scale-105">
              <Play className="size-7 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}

        {/* Kontroll-linje nederst. */}
        {controls && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-foreground/80 to-transparent px-3 pt-8 pb-2.5 transition-opacity duration-200",
              showBar ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {/* Søkelinje. */}
            <div
              onPointerDown={onTrackPointerDown}
              onPointerMove={onTrackPointerMove}
              role="slider"
              aria-label="Søk i videoen"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(current)}
              tabIndex={-1}
              className="group/track relative h-3 cursor-pointer touch-none py-1"
            >
              <div className="h-1 overflow-hidden rounded-full bg-background/30">
                <div
                  className="h-full rounded-full bg-background transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className="-translate-y-1/2 absolute top-1/2 size-3 rounded-full bg-background opacity-0 shadow transition-opacity group-hover/track:opacity-100"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Knapperad. */}
            <div className="flex items-center gap-3 text-background">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Spill av"}
                className="transition-opacity hover:opacity-80"
              >
                {playing ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="size-5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Skru på lyd" : "Demp"}
                className="transition-opacity hover:opacity-80"
              >
                {isMuted ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>

              <span className="font-medium text-xs tabular-nums">
                {formatTime(current)}
                {duration > 0 ? ` / ${formatTime(duration)}` : ""}
              </span>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? "Lukk fullskjerm" : "Fullskjerm"}
                className="ml-auto transition-opacity hover:opacity-80"
              >
                {fullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      {caption && <p className="text-current/70 text-sm">{caption}</p>}
    </Reveal>
  );
}

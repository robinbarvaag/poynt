/**
 * Henter og transkriberer ein podkast-episode frå ein URL via Deepgram.
 *
 * To inngangar:
 *  - `parsePodcastFeed(url)` tek ein RSS-feed (eller direkte lydfil) og gir ei
 *    liste over episodar med rein lyd-URL, slik at brukaren kan velja.
 *  - `transcribeFromUrl(audioUrl)` sender lyd-URL-en til Deepgram (prerecorded),
 *    som handterer episodar av vilkårleg lengde og gir segment-tidsstempel. Vi
 *    byggjer eit transkript med `[mm:ss]`-markørar, så generatoren kan laga
 *    ekte kapittelmerke og klipp-plan i staden for å gjetta.
 *
 * Deepgram er abstrahert bak denne fila, så provider kan byttast utan å røra
 * route eller UI.
 */

const DEEPGRAM_ENDPOINT =
  "https://api.deepgram.com/v1/listen?model=nova-2&language=no&smart_format=true&punctuate=true&paragraphs=true";

const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"];

export class PodcastUrlError extends Error {}

export interface PodcastEpisode {
  title: string;
  date?: string;
  duration?: string;
  audioUrl: string;
}

interface DeepgramParagraph {
  start?: number;
  sentences?: Array<{ text: string }>;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        paragraphs?: { paragraphs?: DeepgramParagraph[] };
      }>;
    }>;
  };
}

function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function looksLikeAudio(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/**
 * Pakkar ut tracking-redirects (Anchor/Spotify pakkar den ekte lyd-URL-en inn i
 * ein `/play/<id>/<url-enkoda ekte url>`-lenke). Returnerer den dekoda fila når
 * vi finn ho, elles URL-en uendra.
 */
export function unwrapTrackingUrl(url: string): string {
  const match = url.match(/(https?%3A%2F%2F.+)$/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return url;
    }
  }
  return url;
}

function stripTag(block: string, tag: string): string | undefined {
  // dotAll-flagget («s») lèt «.» matcha linjeskift, så vi slepp skjøre \s\S-escapes.
  const m = block.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "is"));
  if (!m?.[1]) return undefined;
  const value = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").trim();
  return value || undefined;
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split("/").pop() ?? "");
    return name || "Lydfil";
  } catch {
    return "Lydfil";
  }
}

/**
 * Tek ein RSS-feed og gir ei liste over episodar (nyaste først). Ein direkte
 * lyd-URL gir ein enkelt-episode-liste. Spotify/Apple-sider gir vennleg feil.
 */
export async function parsePodcastFeed(
  inputUrl: string
): Promise<PodcastEpisode[]> {
  if (looksLikeAudio(inputUrl)) {
    return [
      {
        title: filenameFromUrl(inputUrl),
        audioUrl: unwrapTrackingUrl(inputUrl),
      },
    ];
  }

  let res: Response;
  try {
    res = await fetch(inputUrl, {
      headers: { "User-Agent": "Poynt-Podcast/1.0" },
    });
  } catch {
    throw new PodcastUrlError(
      "Kunne ikke hente URL-en. Sjekk at lenken er riktig."
    );
  }

  if (!res.ok) {
    throw new PodcastUrlError(
      "Kunne ikke hente URL-en. Sjekk at lenken er riktig."
    );
  }

  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.startsWith("audio/")) {
    return [{ title: filenameFromUrl(inputUrl), audioUrl: inputUrl }];
  }

  const body = await res.text();
  const looksLikeFeed =
    contentType.includes("xml") ||
    contentType.includes("rss") ||
    /^\s*<\?xml|<rss|<feed/i.test(body);

  if (!looksLikeFeed) {
    throw new PodcastUrlError(
      "Denne lenken er verken en lydfil eller en RSS-feed (f.eks. Spotify/Apple-side). Lim inn RSS-feeden eller en direkte lyd-URL (.mp3)."
    );
  }

  const items = body.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const episodes: PodcastEpisode[] = [];

  for (const item of items) {
    const enclosure = item.match(/<enclosure[^>]*\burl=["']([^"']+)["']/i);
    if (!enclosure?.[1]) continue;

    episodes.push({
      title: stripTag(item, "title") ?? "Episode",
      date: stripTag(item, "pubDate"),
      duration: stripTag(item, "itunes:duration"),
      audioUrl: unwrapTrackingUrl(enclosure[1]),
    });

    if (episodes.length >= 30) break;
  }

  if (episodes.length === 0) {
    throw new PodcastUrlError(
      "Fant ingen episoder med lydfil i feeden. Prøv en direkte lenke til lydfilen."
    );
  }

  return episodes;
}

/**
 * Løyser inn-URL-en til ein faktisk lyd-URL og transkriberer han med Deepgram.
 */
async function resolveAudioUrl(inputUrl: string): Promise<string> {
  const unwrapped = unwrapTrackingUrl(inputUrl);
  if (looksLikeAudio(unwrapped)) return unwrapped;

  let res: Response;
  try {
    res = await fetch(unwrapped, {
      headers: { "User-Agent": "Poynt-Podcast/1.0" },
    });
  } catch {
    throw new PodcastUrlError(
      "Kunne ikke hente URL-en. Sjekk at lenken er riktig."
    );
  }

  if (!res.ok) {
    throw new PodcastUrlError(
      "Kunne ikke hente URL-en. Sjekk at lenken er riktig."
    );
  }

  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.startsWith("audio/")) return unwrapped;

  if (contentType.includes("xml") || contentType.includes("rss")) {
    const body = await res.text();
    const match = body.match(/<enclosure[^>]*\surl=["']([^"']+)["']/i);
    if (match?.[1]) return unwrapTrackingUrl(match[1]);
    throw new PodcastUrlError(
      "Fant ingen lydfil i RSS-feeden. Prøv en direkte lenke til episodens lydfil."
    );
  }

  throw new PodcastUrlError(
    "Denne lenken gir ikke tilgang til selve lyden (f.eks. Spotify/Apple). Lim inn en direkte lyd-URL (.mp3) eller en RSS-feed."
  );
}

export async function transcribeFromUrl(
  inputUrl: string
): Promise<{ transcript: string }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new PodcastUrlError(
      "Transkribering fra URL er ikke konfigurert (mangler DEEPGRAM_API_KEY)."
    );
  }

  const audioUrl = await resolveAudioUrl(inputUrl);

  let res: Response;
  try {
    res = await fetch(DEEPGRAM_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioUrl }),
    });
  } catch {
    throw new PodcastUrlError("Transkripsjon feilet. Prøv igjen.");
  }

  if (res.status === 401) {
    throw new PodcastUrlError(
      "Deepgram avviste nøkkelen (401). Sjekk at DEEPGRAM_API_KEY er gyldig."
    );
  }

  if (!res.ok) {
    throw new PodcastUrlError("Transkripsjon feilet. Prøv igjen.");
  }

  const data = (await res.json()) as DeepgramResponse;
  const alternative = data.results?.channels?.[0]?.alternatives?.[0];

  if (!alternative?.transcript) {
    throw new PodcastUrlError("Fikk ingen transkripsjon tilbake. Prøv igjen.");
  }

  // Bygg transkript med [mm:ss]-markørar frå avsnitta når dei finst, slik at
  // generatoren får ekte tidsstempel. Fall tilbake til rein tekst elles.
  const paragraphs = alternative.paragraphs?.paragraphs;
  if (paragraphs && paragraphs.length > 0) {
    const lines = paragraphs.map((p) => {
      const text = (p.sentences ?? [])
        .map((s) => s.text)
        .join(" ")
        .trim();
      const ts = formatTimestamp(p.start ?? 0);
      return `[${ts}] ${text}`;
    });
    return { transcript: lines.join("\n\n") };
  }

  return { transcript: alternative.transcript };
}

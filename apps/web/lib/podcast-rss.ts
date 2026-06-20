import { XMLParser } from "fast-xml-parser";

export interface PodcastEpisode {
  id: string;
  title: string;
  description?: string;
  /** Lyd-URL (enclosure). */
  audioUrl?: string;
  /** Lenke til episoden (host/Spotify e.l.). */
  link?: string;
  coverUrl?: string;
  /** ISO-dato. */
  publishedAt?: string;
  /** Lesbar varighet, f.eks. "45 min". */
  durationLabel?: string;
  episodeNumber?: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function toText(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (
    typeof value === "object" &&
    "#text" in (value as Record<string, unknown>)
  ) {
    return String((value as Record<string, unknown>)["#text"]);
  }
  return String(value);
}

function stripHtml(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

/** itunes:duration kan være sekunder ("2730") eller "HH:MM:SS" / "MM:SS". */
function formatDuration(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  let seconds: number;
  if (/^\d+$/.test(raw)) {
    seconds = Number.parseInt(raw, 10);
  } else {
    const parts = raw.split(":").map((part) => Number.parseInt(part, 10));
    if (parts.some(Number.isNaN)) {
      return undefined;
    }
    seconds = parts.reduce((acc, part) => acc * 60 + part, 0);
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

interface FetchOptions {
  limit?: number;
  /** Sekunder mellom hver re-henting (Next cache). Default 1 time. */
  revalidate?: number;
}

/**
 * Henter og parser en podcast-RSS-feed til normaliserte episoder. Caches via
 * Next sin fetch-revalidering. Returnerer [] hvis feeden ikke kan leses.
 */
export async function fetchPodcastEpisodes(
  feedUrl: string,
  options: FetchOptions = {}
): Promise<PodcastEpisode[]> {
  let xml: string;
  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: options.revalidate ?? 3600 },
    });
    if (!response.ok) {
      return [];
    }
    xml = await response.text();
  } catch {
    return [];
  }

  const data = parser.parse(xml);
  const channel = data?.rss?.channel;
  if (!channel) {
    return [];
  }

  const channelCover =
    channel["itunes:image"]?.["@_href"] ?? toText(channel.image?.url);

  const rawItems = channel.item;
  const items: Record<string, unknown>[] = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  const episodes = items.map((item, index): PodcastEpisode => {
    const enclosureUrl = (item.enclosure as Record<string, string>)?.["@_url"];
    const link = toText(item.link) ?? enclosureUrl;
    const episodeNumber = Number(toText(item["itunes:episode"]));

    return {
      id: toText(item.guid) ?? link ?? String(index),
      title: toText(item.title) ?? "Uten tittel",
      description: stripHtml(
        toText(item["itunes:summary"]) ?? toText(item.description)
      ),
      audioUrl: enclosureUrl,
      link,
      coverUrl:
        (item["itunes:image"] as Record<string, string>)?.["@_href"] ??
        channelCover,
      publishedAt: item.pubDate
        ? new Date(toText(item.pubDate) ?? "").toISOString()
        : undefined,
      durationLabel: formatDuration(toText(item["itunes:duration"])),
      episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : undefined,
    };
  });

  return options.limit ? episodes.slice(0, options.limit) : episodes;
}

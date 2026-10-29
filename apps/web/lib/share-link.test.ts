import { describe, expect, test } from "bun:test";
import { SHARE_CHANNELS, buildShareUrl, campaignFromPath } from "./share-link";

const story = SHARE_CHANNELS.find((c) => c.key === "instagram-story");
if (!story) throw new Error("mangler instagram-story");

describe("campaignFromPath", () => {
  test("bruker siste del av stien", () => {
    expect(campaignFromPath("/produkter/verdifull-vekst")).toBe(
      "verdifull-vekst"
    );
  });
  test("forsiden heter forside", () => {
    expect(campaignFromPath("/")).toBe("forside");
  });
});

describe("buildShareUrl", () => {
  const now = new Date("2026-10-29T23:30:00Z"); // 00:30 30. okt i Oslo

  test("legger på kanal, side og dato (norsk tid)", () => {
    const url = new URL(
      buildShareUrl("https://poynt.no/produkter/verdifull-vekst", story, now)
    );
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.get("utm_medium")).toBe("story");
    expect(url.searchParams.get("utm_campaign")).toBe("verdifull-vekst");
    expect(url.searchParams.get("utm_content")).toBe("2026-10-30");
  });

  test("erstatter gammel merking, beholder andre parametre, dropper hash", () => {
    const url = new URL(
      buildShareUrl(
        "https://poynt.no/om?utm_source=facebook&fbclid=abc&variant=b#kontakt",
        story,
        now
      )
    );
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.has("fbclid")).toBe(false);
    expect(url.searchParams.get("variant")).toBe("b");
    expect(url.hash).toBe("");
  });
});

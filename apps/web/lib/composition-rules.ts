/**
 * Regelbaserte komposisjonsregler for sider bygd av blokker (docs/COMPOSITION.md
 * §2, §5 og §7). Rene funksjoner uten React/Payload-avhengigheter, så de kan
 * kjøre både live i admin («Sidesjekk», composition-check.tsx) og på server
 * (MCP-serveren sjekker utkast før de lagres). Nye regler legges til HER, så
 * admin-panelet og MCP-en aldri glir fra hverandre.
 */

export interface Finding {
  level: "advarsel" | "tips";
  text: string;
}

export interface BlockInfo {
  index: number;
  blockType: string;
  /** Teller blokka som mettet fargepanel i panel-rasjoneringen? */
  isPanel: boolean;
  primaryCtaUrl?: string;
  eyebrow?: string;
  title?: string;
}

export const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  ctaSection: "CTA-seksjon",
  statsBand: "Tall-bånd",
  newsletter: "Nyhetsbrev",
  featureGrid: "Innholdskort",
  pathCards: "Veivalg-kort",
  testimonials: "Anmeldelser",
  productArchive: "Produkter",
  podcastArchive: "Podkast",
  servicesArchive: "Tjenester",
  logoCloud: "Logo-stripe",
  bookHero: "Objekt-hero",
  resourceList: "Ressursliste",
  promptLibrary: "Prompt-bibliotek",
};

export function blockLabel(blockType: string): string {
  return BLOCK_LABELS[blockType] ?? blockType;
}

/** Er blokka et mettet fargepanel gitt sine oppsett-valg? */
export function isPanelBlock(
  blockType: string,
  get: (path: string) => unknown
): boolean {
  if (blockType === "newsletter") return true;
  if (blockType === "ctaSection") {
    const variant = get("variant");
    return variant === "colored" || variant === "image";
  }
  if (blockType === "statsBand") return get("layout") !== "split";
  return false;
}

const str = (value: unknown): string | undefined =>
  typeof value === "string" ? value.trim() : undefined;

/**
 * Bygger BlockInfo fra et lagret/innsendt layout-array (nestede objekter,
 * slik Payload lagrer det). Admin-panelet har sin egen leser for den flate
 * skjema-tilstanden.
 */
export function blocksFromLayout(layout: unknown): BlockInfo[] {
  if (!Array.isArray(layout)) return [];
  const blocks: BlockInfo[] = [];
  layout.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") return;
    const block = raw as Record<string, unknown>;
    const blockType = str(block.blockType);
    if (!blockType) return;
    const get = (path: string): unknown => {
      let cur: unknown = block;
      for (const part of path.split(".")) {
        if (!cur || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[part];
      }
      return cur;
    };
    blocks.push({
      index,
      blockType,
      isPanel: isPanelBlock(blockType, get),
      primaryCtaUrl: str(get("primaryCta.url")),
      eyebrow: str(get("eyebrow")),
      title: str(get("title")),
    });
  });
  return blocks;
}

export function analyseComposition(blocks: BlockInfo[]): Finding[] {
  const findings: Finding[] = [];
  if (!blocks.length) return findings;
  const label = blockLabel;

  // 1. Maks to mettede fargepaneler per side.
  const panels = blocks.filter((b) => b.isPanel);
  if (panels.length > 2) {
    findings.push({
      level: "advarsel",
      text: `Siden har ${panels.length} seksjoner med farget bakgrunn (${panels
        .map((p) => `${label(p.blockType)} i seksjon ${p.index + 1}`)
        .join(
          ", "
        )}). To holder — endre f.eks. et Tall-bånd til «Delt», eller en CTA til «Enkel».`,
    });
  }

  // 2. Aldri to fargepaneler rett etter hverandre.
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].isPanel && blocks[i - 1].isPanel) {
      findings.push({
        level: "advarsel",
        text: `${label(blocks[i - 1].blockType)} (seksjon ${
          blocks[i - 1].index + 1
        }) og ${label(blocks[i].blockType)} (seksjon ${
          blocks[i].index + 1
        }) har begge farget bakgrunn og ligger rett etter hverandre — legg en rolig seksjon mellom, eller endre den ene.`,
      });
    }
  }

  // 3. Hero: én, og alltid først.
  const heroes = blocks.filter((b) => b.blockType === "hero");
  if (heroes.length > 1) {
    findings.push({
      level: "advarsel",
      text: "Siden har flere Hero-blokker — behold én, øverst.",
    });
  } else if (heroes.length === 1 && blocks[0].blockType !== "hero") {
    findings.push({
      level: "tips",
      text: "Hero-blokka ligger ikke øverst — den fungerer best som sidens første seksjon.",
    });
  }

  // 4. Nyhetsbrev: maks ett, og sist.
  const newsletters = blocks.filter((b) => b.blockType === "newsletter");
  if (newsletters.length > 1) {
    findings.push({
      level: "advarsel",
      text: "Siden har flere Nyhetsbrev-blokker — behold én.",
    });
  } else if (
    newsletters.length === 1 &&
    blocks[blocks.length - 1].blockType !== "newsletter"
  ) {
    findings.push({
      level: "tips",
      text: "Nyhetsbrev fungerer best som sidens siste seksjon.",
    });
  }

  // 5. Samme CTA-mål flere ganger (hero + CTA-seksjoner).
  const urls = new Map<string, BlockInfo[]>();
  for (const b of blocks) {
    if (b.primaryCtaUrl) {
      const list = urls.get(b.primaryCtaUrl) ?? [];
      list.push(b);
      urls.set(b.primaryCtaUrl, list);
    }
  }
  for (const [url, sameUrl] of urls) {
    if (sameUrl.length > 1) {
      const navn = sameUrl.map(
        (b) => `${label(b.blockType)} (seksjon ${b.index + 1})`
      );
      const hvor = `${navn.slice(0, -1).join(", ")} og ${navn[navn.length - 1]}`;
      findings.push({
        level: "tips",
        text: `${hvor} har ${sameUrl.length === 2 ? "begge" : "alle"} knapp som peker til «${url}». Én hovedknapp per side er tydeligere — de andre seksjonene kan godt stå uten knapp.`,
      });
    }
  }

  // 6. Etiketten over tittelen skal tilføre noe. Gjentar den tittelen (eller
  //    omvendt), er den bare støy — da er det bedre å la den stå tom.
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N} ]/gu, "")
      .trim();
  for (const b of blocks) {
    if (!b.eyebrow || !b.title) continue;
    const e = norm(b.eyebrow);
    const t = norm(b.title);
    if (e && t && (e === t || t.includes(e) || e.includes(t))) {
      findings.push({
        level: "tips",
        text: `Den lille teksten over tittelen i ${label(b.blockType)} (seksjon ${b.index + 1}) sier omtrent det samme som tittelen («${b.eyebrow}» / «${b.title}»). Den skal gi leseren litt ekstra kontekst — la den heller stå tom enn å gjenta.`,
      });
    }
  }

  // 7. Samme etikett på flere seksjoner → mister funksjonen som veiviser.
  const eyebrows = new Map<string, BlockInfo[]>();
  for (const b of blocks) {
    if (!b.eyebrow) continue;
    const key = norm(b.eyebrow);
    if (!key) continue;
    const list = eyebrows.get(key) ?? [];
    list.push(b);
    eyebrows.set(key, list);
  }
  for (const sameEyebrow of eyebrows.values()) {
    if (sameEyebrow.length > 1) {
      findings.push({
        level: "tips",
        text: `Flere seksjoner (${sameEyebrow
          .map((b) => `seksjon ${b.index + 1}`)
          .join(
            ", "
          )}) har den samme lille teksten over tittelen («${sameEyebrow[0].eyebrow}»). Den fungerer som veiviser nedover siden — gi hver seksjon sin egen, eller la noen stå tomme.`,
      });
    }
  }

  // 8. Veldig mange blokker → siden mister retning.
  if (blocks.length > 12) {
    findings.push({
      level: "tips",
      text: `Siden har ${blocks.length} seksjoner — det kan bli mye å scrolle gjennom. Vurder å slå sammen noen, eller flytte innhold til en egen side.`,
    });
  }

  return findings;
}

export const COMPOSITION_GUIDELINES: string[] = [
  "Alle seksjoner har samme bredde og starter på samme venstrekant — det ordner blokkene selv.",
  "Overskrifter står til venstre. Bare hero og siste CTA er midtstilt.",
  "Maks to seksjoner med farget bakgrunn per side — og aldri to rett etter hverandre.",
  "Velg én ting du vil at leseren skal gjøre. Ikke alle seksjoner trenger en knapp.",
  "Hero øverst, nyhetsbrev nederst. Avstanden mellom seksjoner er alltid den samme.",
  "Den lille teksten over en tittel skal gi ekstra kontekst («Historien bak boka»), ikke gjenta tittelen. Usikker? Dropp den.",
];

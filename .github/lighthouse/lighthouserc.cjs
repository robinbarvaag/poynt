// Lighthouse CI-oppsett for .github/workflows/lighthouse.yml — se docs/PERFORMANCE.md.
//
// Styres med miljøvariabler så samme fil dekker mobil og desktop, produksjon og preview:
//   LHCI_FORM_FACTOR  "mobile" (standard) eller "desktop"
//   LHCI_BASE_URL     standard https://www.poynt.no
//   LHCI_PATHS        kommaseparert liste som overstyrer sidene (for lokale prøvekjøringer)
//   LHCI_RUNS         antall kjøringer per side (standard 3 — medianen rapporteres)
//   LHCI_OUTPUT_DIR   hvor rapportene havner (standard lighthouse-reports/<formfaktor>)
//   VERCEL_AUTOMATION_BYPASS_SECRET  valgfri — bare for previews med Deployment Protection

const formFactor =
  process.env.LHCI_FORM_FACTOR === "desktop" ? "desktop" : "mobile";
const baseUrl = (process.env.LHCI_BASE_URL || "https://www.poynt.no").replace(
  /\/+$/,
  ""
);

// De fem sidene fra den eksterne rapporten + ett blogginnlegg og én tjenesteside.
const defaultPaths = [
  "/",
  "/tjenester",
  "/produkter",
  "/blogg",
  "/kundehistorier",
  "/blogg/fem-ting-du-kan-bruke-ai-til-i-markedsforing",
  "/tjenester/kurs-og-foredrag",
];
const paths = process.env.LHCI_PATHS
  ? process.env.LHCI_PATHS.split(",")
      .map((path) => path.trim())
      .filter(Boolean)
  : defaultPaths;

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// Startbudsjett. Alt er "warn": avvik flagges i oppsummeringen, men stopper ingenting.
const aggregationMethod = "median";
const assertions = {
  "categories:performance": [
    "warn",
    { minScore: formFactor === "desktop" ? 0.9 : 0.8, aggregationMethod },
  ],
  "largest-contentful-paint": [
    "warn",
    { maxNumericValue: 2500, aggregationMethod },
  ],
  "cumulative-layout-shift": [
    "warn",
    { maxNumericValue: 0.1, aggregationMethod },
  ],
  "total-blocking-time": ["warn", { maxNumericValue: 200, aggregationMethod }],
  // Automatiske tilgjengelighetssjekker (kontrast, alt-tekst, etiketter, ARIA).
  "categories:accessibility": ["warn", { minScore: 0.95, aggregationMethod }],
};

module.exports = {
  ci: {
    collect: {
      url: paths.map((path) => `${baseUrl}${path}`),
      numberOfRuns: Number(process.env.LHCI_RUNS) || 3,
      settings: {
        // Mobil = Lighthouse-standarden (simulert treg 4G + 4x CPU-brems), samme som PageSpeed Insights.
        ...(formFactor === "desktop" ? { preset: "desktop" } : {}),
        // GitHub-runnerne (Ubuntu 24.04) tillater ikke Chromes sandkasse uten root.
        chromeFlags: "--no-sandbox",
        ...(bypassSecret
          ? { extraHeaders: { "x-vercel-protection-bypass": bypassSecret } }
          : {}),
      },
    },
    assert: { assertions },
    upload: {
      target: "filesystem",
      outputDir:
        process.env.LHCI_OUTPUT_DIR || `lighthouse-reports/${formFactor}`,
    },
  },
};

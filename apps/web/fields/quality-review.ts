import type { Field } from "payload";

/**
 * Felles felter for AI-kvalitetsvurderingen («Vurder kvalitet»), brukt på
 * Guider, Sider og Blogginnlegg. Panelet (ui-feltet) snakker med
 * /api/ai/quality-review, som velger vurderingsdimensjoner ut fra hvilken
 * collection dokumentet står i. Datafeltene persisterer resultatet;
 * `qualityScore` driver `low_quality`-signalet i Innholdsradaren.
 */

/** «Vurder kvalitet»-panelet — plasser der det passer i skjemaet. */
export function qualityReviewPanel(): Field {
  return {
    name: "kvalitetsvurdering",
    type: "ui",
    label: "Kvalitetsvurdering",
    admin: {
      components: {
        Field: "/admin/components/quality-review-button#QualityReviewButton",
      },
    },
  };
}

/**
 * De persisterte vurderingsfeltene (sidebar + skjult rådata).
 * `sidebarSection: true` samler score + sist vurdert i en egen sammenleggbar
 * «Kvalitet»-seksjon i sidebaren (kun presentasjon — samme feltnavn og
 * DB-skjema, så ingen migrasjon). Landet på Kundehistorier først; ta i bruk
 * på de andre collectionene når uttrykket er bekreftet.
 */
export function qualityDataFields(opts?: {
  sidebarSection?: boolean;
}): Field[] {
  const score: Field = {
    name: "qualityScore",
    type: "number",
    label: "Kvalitetsscore",
    min: 0,
    max: 100,
    admin: {
      ...(opts?.sidebarSection ? {} : { position: "sidebar" as const }),
      readOnly: true,
      description: "Settes av AI-vurderingen (0–100).",
    },
  };
  const reviewedAt: Field = {
    name: "qualityReviewedAt",
    type: "date",
    label: "Sist vurdert",
    admin: {
      ...(opts?.sidebarSection ? {} : { position: "sidebar" as const }),
      readOnly: true,
      date: { displayFormat: "dd.MM.yyyy HH:mm" },
    },
  };

  const visible: Field[] = opts?.sidebarSection
    ? [
        {
          type: "collapsible",
          label: "Kvalitet",
          admin: {
            position: "sidebar",
            initCollapsed: false,
          },
          fields: [score, reviewedAt],
        },
      ]
    : [score, reviewedAt];

  return [
    ...visible,
    {
      // Hele vurderingen (oppsummering, delscore, fiks, innholds-hash). Rendres
      // av panelet; skjult som rått felt fordi JSON-en er stor og stygg.
      name: "qualityReview",
      type: "json",
      label: "Kvalitetsvurdering (rådata)",
      admin: {
        hidden: true,
      },
    },
  ];
}

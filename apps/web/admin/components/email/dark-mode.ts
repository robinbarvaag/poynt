/**
 * Etterligning av «tvungen mørk modus» i e-postklienter, til forhåndsvisningen
 * i admin. Malene våre er designet lyse; Gmail og Outlook inverterer da
 * fargene selv når mottakeren har mørk modus — og hver klient gjør det litt
 * ulikt, så dette er en tilnærming (filter-invertering, bilder holdes
 * uendret), ikke en fasit. Apple Mail viser stort sett e-posten som designet.
 */
export function simulateDarkMode(html: string): string {
  const style = `<style>
    html { filter: invert(0.92) hue-rotate(180deg); background: #0b0d0d; }
    img { filter: invert(1) hue-rotate(180deg); }
  </style>`;
  return html.includes("</head>")
    ? html.replace("</head>", `${style}</head>`)
    : style + html;
}

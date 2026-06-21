/**
 * Genererer favicon-filer fra Poynt-ordmerket.
 *
 * Trekker ut «Y»-glyfen fra `poynt-assets/Logo til mailsignatur.png` (mint på
 * hvit), nøkler bort den hvite bakgrunnen, farger glyfen i merkevare-mint og
 * komponerer den sentrert på en mørk Forrest Green-flis med avrundede hjørner.
 *
 * Skriver: app/icon.png (512), app/apple-icon.png (180), app/favicon.ico (32).
 *
 * Kjør: node apps/web/scripts/generate-favicon.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "../../poynt-assets/Logo til mailsignatur.png");
const APP_DIR = path.join(ROOT, "app");

// Merkevarefarger.
const TILE = { r: 0, g: 64, b: 41 }; // Forrest Green #004029
const GLYPH = { r: 171, g: 227, b: 227 }; // Celeste #abe3e3 (mint)

async function main() {
  const img = sharp(SRC).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data } = await img
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = 4;

  // Luminans per piksel; "innhold" = mørkere enn nær-hvit.
  const isContent = (x, y) => {
    const i = (y * width + x) * channels;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    return lum < 245;
  };

  // Kolonner med innhold → klynger (bokstaver), adskilt av tomme kolonner.
  const colHasContent = [];
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) if (isContent(x, y)) count++;
    colHasContent[x] = count > 2;
  }
  const clusters = [];
  let start = -1;
  for (let x = 0; x <= width; x++) {
    if (colHasContent[x] && start === -1) start = x;
    else if (!colHasContent[x] && start !== -1) {
      clusters.push([start, x - 1]);
      start = -1;
    }
  }
  if (clusters.length < 3) {
    throw new Error(`Forventet 5 bokstaver, fant ${clusters.length} klynger`);
  }
  // «POYNT» → Y er den midterste klyngen (indeks 2).
  const [x0, x1] = clusters[2];

  // Vertikale grenser for Y-glyfen.
  let y0 = height;
  let y1 = 0;
  for (let x = x0; x <= x1; x++) {
    for (let y = 0; y < height; y++) {
      if (isContent(x, y)) {
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  const gw = x1 - x0 + 1;
  const gh = y1 - y0 + 1;

  // Bygg en farget glyf med alfa avledet av hvor langt pikselen er fra hvit.
  const glyph = Buffer.alloc(gw * gh * 4);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const si = ((y0 + y) * width + (x0 + x)) * channels;
      const lum =
        0.299 * data[si] + 0.587 * data[si + 1] + 0.114 * data[si + 2];
      // Myk rampe: nær-hvit → gjennomsiktig, mint → ugjennomsiktig.
      const alpha = Math.max(0, Math.min(255, Math.round((250 - lum) * 8)));
      const di = (y * gw + x) * 4;
      glyph[di] = GLYPH.r;
      glyph[di + 1] = GLYPH.g;
      glyph[di + 2] = GLYPH.b;
      glyph[di + 3] = alpha;
    }
  }

  async function render(size, file) {
    const radius = Math.round(size * 0.22);
    const tileSvg = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" ` +
        `fill="rgb(${TILE.r},${TILE.g},${TILE.b})"/></svg>`
    );

    // Glyfen skal fylle ~58% av flisa, med bevart størrelsesforhold.
    const target = Math.round(size * 0.58);
    const scale = Math.min(target / gw, target / gh);
    const gW = Math.max(1, Math.round(gw * scale));
    const gH = Math.max(1, Math.round(gh * scale));

    const glyphPng = await sharp(glyph, {
      raw: { width: gw, height: gh, channels: 4 },
    })
      .resize(gW, gH, { fit: "fill" })
      .png()
      .toBuffer();

    return sharp(tileSvg)
      .composite([
        {
          input: glyphPng,
          left: Math.round((size - gW) / 2),
          top: Math.round((size - gH) / 2),
        },
      ])
      .png()
      .toBuffer()
      .then((buf) => {
        if (file) fs.writeFileSync(path.join(APP_DIR, file), buf);
        return buf;
      });
  }

  await render(512, "icon.png");
  await render(180, "apple-icon.png");

  // favicon.ico: pakk en 32×32 PNG inn i en ICO-container.
  const ico32 = await render(32, null);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservert
  header.writeUInt16LE(1, 2); // type = ikon
  header.writeUInt16LE(1, 4); // antall bilder
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // bredde
  entry.writeUInt8(32, 1); // høyde
  entry.writeUInt8(0, 2); // farger
  entry.writeUInt8(0, 3); // reservert
  entry.writeUInt16LE(1, 4); // fargeplan
  entry.writeUInt16LE(32, 6); // bits per piksel
  entry.writeUInt32LE(ico32.length, 8); // bytes i bildet
  entry.writeUInt32LE(22, 12); // offset til bildedata
  fs.writeFileSync(
    path.join(APP_DIR, "favicon.ico"),
    Buffer.concat([header, entry, ico32])
  );

  console.log(
    `Ferdig. Y-glyf: x[${x0}-${x1}] y[${y0}-${y1}] (${gw}×${gh}). ` +
      `Skrev icon.png, apple-icon.png, favicon.ico til ${APP_DIR}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

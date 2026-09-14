import QRCode from "qrcode";

/**
 * QR-koder for billetter. Koden inneholder billettlenken, så et vanlig
 * mobilkamera åpner billettsiden, og innsjekk-skanneren henter nøkkelen ut av
 * lenken. Mørk grønn på hvit bakgrunn: nok kontrast til at alle skannere
 * leser den, også på en skjerm med lav lysstyrke.
 */

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#004029", light: "#ffffff" },
};

/** PNG til e-post (legges ved som innebygd bilde, se @poynt/email). */
export function ticketQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: 480 });
}

/** SVG til billettsiden — skarp i alle størrelser, ingen ekstra forespørsel. */
export function ticketQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

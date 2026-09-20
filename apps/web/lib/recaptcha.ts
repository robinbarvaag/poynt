import {
  RECAPTCHA_HEADER,
  recaptchaErrorMessage,
  verifyRecaptcha,
} from "@poynt/utils/recaptcha";
import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "./rate-limit";

/**
 * reCAPTCHA-vakt for API-rutene våre.
 *
 * Tokenet sendes som header (`x-recaptcha-token`) i stedet for i JSON-kroppen,
 * slik at endepunkter som sender kroppen rett videre til Payload eller Stripe
 * slipper å plukke ut et ekstra felt.
 *
 * Bruk øverst i en POST-handler, rett etter rate-limit:
 *
 *   const blocked = await guardRecaptcha(request, "nyhetsbrev");
 *   if (blocked) return blocked;
 *
 * Er RECAPTCHA_SECRET_KEY ikke satt, returnerer den alltid null (alt slipper
 * gjennom) — se packages/utils/recaptcha.ts.
 */

export interface GuardOptions {
  /** Strengere terskel enn standard for særlig utsatte endepunkter. */
  minScore?: number;
}

/**
 * Returnerer en ferdig 403-respons hvis innsendingen skal stoppes, ellers
 * null. Logger alltid årsaken, så vi kan se om terskelen er for streng.
 */
export async function guardRecaptcha(
  request: NextRequest,
  action: string,
  options: GuardOptions = {}
): Promise<NextResponse | null> {
  const token = request.headers.get(RECAPTCHA_HEADER);
  const result = await verifyRecaptcha(token, {
    action,
    remoteIp: getClientIp(request.headers),
    minScore: options.minScore,
  });

  if (result.ok) return null;

  console.warn(
    `[recaptcha] avvist «${action}»: ${result.reason}`,
    result.score !== undefined ? `score=${result.score}` : "",
    result.errorCodes?.join(",") ?? ""
  );

  return NextResponse.json(
    { error: recaptchaErrorMessage(result.reason) },
    { status: 403 }
  );
}

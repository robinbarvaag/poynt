/**
 * Tynn klient for Vipps MobilePay ePayment API.
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 *
 * Miljøvariabler: VIPPS_MSN, VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET,
 * VIPPS_SUBSCRIPTION_KEY, VIPPS_API_URL (test: https://apitest.vipps.no,
 * prod: https://api.vipps.no) og VIPPS_WEBHOOK_SECRET (fra
 * scripts/register-vipps-webhook.ts).
 */
import crypto from "node:crypto";

const API_URL = process.env.VIPPS_API_URL || "https://apitest.vipps.no";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} er ikkje satt`);
  return value;
}

function baseHeaders(): Record<string, string> {
  return {
    "Ocp-Apim-Subscription-Key": requiredEnv("VIPPS_SUBSCRIPTION_KEY"),
    "Merchant-Serial-Number": requiredEnv("VIPPS_MSN"),
    "Vipps-System-Name": "poynt-web",
    "Vipps-System-Version": "1.0.0",
    "Content-Type": "application/json",
  };
}

// Access-token er gyldig i ~1 time (test) / ~24 timer (prod) — cache i modulen
// og forny 60 sekunder før utløp.
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getVippsAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${API_URL}/accesstoken/get`, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      client_id: requiredEnv("VIPPS_CLIENT_ID"),
      client_secret: requiredEnv("VIPPS_CLIENT_SECRET"),
    },
  });

  if (!res.ok) {
    throw new Error(
      `Vipps accesstoken feila: ${res.status} ${await res.text()}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_on?: string;
    expires_in?: string;
  };

  const expiresAt = data.expires_on
    ? Number(data.expires_on) * 1000 - 60_000
    : Date.now() + (Number(data.expires_in ?? 3600) - 60) * 1000;

  cachedToken = { token: data.access_token, expiresAt };
  return data.access_token;
}

async function vippsFetch(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string }
): Promise<Response> {
  const token = await getVippsAccessToken();
  return fetch(`${API_URL}${path}`, {
    method: init.method,
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${token}`,
      ...(init.idempotencyKey && { "Idempotency-Key": init.idempotencyKey }),
    },
    ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
  });
}

export type VippsAmount = { currency: "NOK"; value: number };

export type VippsUserDetails = {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
};

export type VippsPayment = {
  reference: string;
  state: "CREATED" | "AUTHORIZED" | "ABORTED" | "EXPIRED" | "TERMINATED";
  amount: VippsAmount;
  aggregate?: {
    authorizedAmount?: VippsAmount;
    capturedAmount?: VippsAmount;
    refundedAmount?: VippsAmount;
    cancelledAmount?: VippsAmount;
  };
  profile?: { sub?: string };
  userDetails?: VippsUserDetails;
};

/**
 * Opprett ein betaling og få redirect-URL til Vipps-landingssida.
 * `profileScope` ber brukaren dele t.d. "name email phoneNumber" i appen
 * (hurtigkasse for digitale produkt — vi slepp eige skjema).
 */
export async function createVippsPayment(params: {
  reference: string;
  /** Beløp i øre. */
  amountValue: number;
  description: string;
  returnUrl: string;
  profileScope?: string;
}): Promise<{ redirectUrl: string; reference: string }> {
  const res = await vippsFetch("/epayment/v1/payments", {
    method: "POST",
    idempotencyKey: params.reference,
    body: {
      amount: { currency: "NOK", value: params.amountValue },
      paymentMethod: { type: "WALLET" },
      reference: params.reference,
      returnUrl: params.returnUrl,
      userFlow: "WEB_REDIRECT",
      paymentDescription: params.description,
      ...(params.profileScope && { profile: { scope: params.profileScope } }),
    },
  });

  if (!res.ok) {
    throw new Error(
      `Vipps create payment feila: ${res.status} ${await res.text()}`
    );
  }

  return (await res.json()) as { redirectUrl: string; reference: string };
}

export async function getVippsPayment(
  reference: string
): Promise<VippsPayment> {
  const res = await vippsFetch(`/epayment/v1/payments/${reference}`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error(
      `Vipps get payment feila: ${res.status} ${await res.text()}`
    );
  }
  return (await res.json()) as VippsPayment;
}

/**
 * Capture av reservert beløp. Vipps reserverer berre ved godkjenning — utan
 * capture blir pengane aldri overførte. Digitale produkt leverast umiddelbart,
 * så vi capturar i webhooken når betalinga er autorisert.
 */
export async function captureVippsPayment(
  reference: string,
  amountValue: number
): Promise<void> {
  const res = await vippsFetch(`/epayment/v1/payments/${reference}/capture`, {
    method: "POST",
    idempotencyKey: `capture-${reference}`,
    body: { modificationAmount: { currency: "NOK", value: amountValue } },
  });
  if (!res.ok) {
    throw new Error(`Vipps capture feila: ${res.status} ${await res.text()}`);
  }
}

export async function refundVippsPayment(
  reference: string,
  amountValue: number
): Promise<void> {
  const res = await vippsFetch(`/epayment/v1/payments/${reference}/refund`, {
    method: "POST",
    idempotencyKey: `refund-${reference}-${amountValue}`,
    body: { modificationAmount: { currency: "NOK", value: amountValue } },
  });
  if (!res.ok) {
    throw new Error(`Vipps refund feila: ${res.status} ${await res.text()}`);
  }
}

/** Fallback når userDetails manglar på betalinga: hent profil via sub. */
export async function getVippsUserinfo(
  sub: string
): Promise<{ email?: string; name?: string } | null> {
  const token = await getVippsAccessToken();
  const res = await fetch(`${API_URL}/vipps-userinfo-api/userinfo/${sub}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": requiredEnv("VIPPS_SUBSCRIPTION_KEY"),
      "Merchant-Serial-Number": requiredEnv("VIPPS_MSN"),
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as { email?: string; name?: string };
}

/**
 * Verifiser signaturen på ein innkomande Vipps-webhook.
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/request-authentication/
 *
 * Signert streng: "POST\n<pathAndQuery>\n<x-ms-date>;<host>;<x-ms-content-sha256>"
 * signert med HMAC-SHA256 og webhook-secreten frå registreringa.
 */
export function verifyVippsWebhookSignature(params: {
  pathAndQuery: string;
  host: string;
  xMsDate: string;
  xMsContentSha256: string;
  authorization: string;
  rawBody: string;
  secret: string;
}): boolean {
  const computedContentHash = crypto
    .createHash("sha256")
    .update(params.rawBody, "utf8")
    .digest("base64");
  if (computedContentHash !== params.xMsContentSha256) return false;

  const signedString = `POST\n${params.pathAndQuery}\n${params.xMsDate};${params.host};${params.xMsContentSha256}`;
  const expectedSignature = crypto
    .createHmac("sha256", params.secret)
    .update(signedString, "utf8")
    .digest("base64");

  const match = params.authorization.match(/Signature=([A-Za-z0-9+/=]+)/);
  if (!match) return false;

  const received = Buffer.from(match[1]);
  const expected = Buffer.from(expectedSignature);
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

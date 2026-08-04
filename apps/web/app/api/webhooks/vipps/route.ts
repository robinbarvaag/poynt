import { getNotificationEmails } from "@/lib/notification-emails";
import { buildOrderEmailExtras } from "@/lib/order-email";
import {
  captureVippsPayment,
  getVippsPayment,
  getVippsUserinfo,
  verifyVippsWebhookSignature,
} from "@/lib/vipps";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/webhook-events";
import config from "@/payload.config";
import {
  sendOrderConfirmation,
  sendSaleNotification,
  subscribeToNewsletter,
} from "@poynt/email";
import { db } from "@poynt/planner-db";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Vipps ePayment-webhook. Registrer URL-en med scripts/register-vipps-webhook.ts
 * og legg secreten i VIPPS_WEBHOOK_SECRET.
 *
 * Flyt: AUTHORIZED → hent betaling (userDetails frå profile sharing) →
 * capture heile beløpet (digital levering skjer umiddelbart) → ordre «betalt»
 * → kvitterings-epost. ABORTED/EXPIRED/CANCELLED/TERMINATED → ordre «avbrutt».
 */

type VippsWebhookEvent = {
  msn?: string;
  reference?: string;
  pspReference?: string;
  name?: string;
  success?: boolean;
};

/** Normaliser eventnavn: "epayments.payment.authorized.v1" → "AUTHORIZED". */
function eventName(event: VippsWebhookEvent): string {
  const name = event.name ?? "";
  if (name.includes(".")) {
    const parts = name.split(".");
    return (parts[parts.length - 2] ?? "").toUpperCase();
  }
  return name.toUpperCase();
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const secret = process.env.VIPPS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("VIPPS_WEBHOOK_SECRET er ikkje satt");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const xMsDate = req.headers.get("x-ms-date") ?? "";
  const xMsContentSha256 = req.headers.get("x-ms-content-sha256") ?? "";
  const authorization = req.headers.get("authorization") ?? "";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";

  const validSignature = verifyVippsWebhookSignature({
    pathAndQuery: req.nextUrl.pathname + req.nextUrl.search,
    host,
    xMsDate,
    xMsContentSha256,
    authorization,
    rawBody,
    secret,
  });

  if (!validSignature) {
    console.error("Vipps webhook: ugyldig signatur");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as VippsWebhookEvent;
  const name = eventName(event);
  const reference = event.reference;

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  // Same idempotens-register som Stripe-webhooken - kravsett atomisk slik at
  // samtidige leveranser ikkje begge behandlar eventet.
  const eventId = `vipps:${reference}:${name}:${event.pspReference ?? ""}`;
  const claimed = await claimWebhookEvent(
    db,
    eventId,
    `vipps.${name.toLowerCase()}`
  );
  if (!claimed) {
    return NextResponse.json({ received: true });
  }

  const payload = await getPayload({ config });
  const orders = await payload.find({
    collection: "orders",
    where: { vippsReference: { equals: reference } },
    limit: 1,
    depth: 1,
  });
  const order = orders.docs[0];

  if (!order) {
    console.warn(`Vipps webhook: fann ingen ordre for referanse ${reference}`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (name) {
      case "AUTHORIZED": {
        if (order.status !== "pending") break;

        const payment = await getVippsPayment(reference);

        // Kundeinfo frå profile sharing — userDetails på betalinga, med
        // userinfo-API-et som fallback via profile.sub.
        let customerEmail = payment.userDetails?.email;
        let customerName = [
          payment.userDetails?.firstName,
          payment.userDetails?.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        if (!customerEmail && payment.profile?.sub) {
          const userinfo = await getVippsUserinfo(payment.profile.sub);
          customerEmail = userinfo?.email ?? undefined;
          customerName = customerName || (userinfo?.name ?? "");
        }

        // Digital levering skjer umiddelbart — capture med ein gong.
        await captureVippsPayment(reference, Math.round(order.total * 100));

        await payload.update({
          collection: "orders",
          id: order.id,
          data: {
            status: "paid",
            ...(customerEmail && { customerEmail }),
            ...(customerName && { customerName }),
          },
        });

        const email = customerEmail || order.customerEmail;
        if (email) {
          const extras = await buildOrderEmailExtras(
            payload,
            (order.items ?? []).map((item) =>
              typeof item.product === "object" ? item.product.id : item.product
            )
          );

          await sendOrderConfirmation({
            email,
            orderNumber: String(order.id),
            customerName: customerName || order.customerName || undefined,
            items: (order.items ?? []).map((item) => ({
              name:
                typeof item.product === "object"
                  ? item.product.name
                  : `Produkt ${item.product}`,
              quantity: item.quantity,
              price: item.priceAtPurchase,
              variant: item.variant ?? undefined,
            })),
            total: order.total,
            subject: extras.subject,
            content: extras.content,
            attachments: extras.attachments,
          });
        } else {
          console.error(
            `Vipps-ordre ${order.id} betalt, men utan e-post — kvittering ikkje sendt`
          );
        }

        // Aktivt samtykke fra utsjekken → meld på nyhetsbrevet. Bruk den
        // EKTE kundeadressen (ikke test-omdirigering) og svelg feil.
        if (order.newsletterOptIn && email) {
          const result = await subscribeToNewsletter(email);
          if (!result.success) {
            console.error("Nyhetsbrev-påmelding feilet:", result.error);
          }
        }

        // Internt salgsvarsel til oss. Svelg feil — en webhook-retry etter at
        // ordren er betalt skal ikke utløses av et feilet varsel.
        try {
          await sendSaleNotification({
            to: await getNotificationEmails(),
            kind: "Produktsalg",
            orderNumber: String(order.id),
            customerName: customerName || order.customerName || undefined,
            customerEmail: email || "ukjent",
            items: (order.items ?? []).map((item) => ({
              name:
                typeof item.product === "object"
                  ? item.product.name
                  : `Produkt ${item.product}`,
              quantity: item.quantity,
              price: item.priceAtPurchase,
            })),
            total: order.total,
            paymentProvider: "Vipps",
            adminUrl: `${process.env.NEXT_PUBLIC_URL}/admin/collections/orders/${order.id}`,
          });
        } catch (notifyError) {
          console.error("Salgsvarsel feilet:", notifyError);
        }

        console.log(`Vipps-ordre ${order.id} betalt og captura (${reference})`);
        break;
      }

      case "ABORTED":
      case "EXPIRED":
      case "CANCELLED":
      case "TERMINATED": {
        if (order.status === "pending") {
          await payload.update({
            collection: "orders",
            id: order.id,
            data: { status: "cancelled" },
          });
          console.log(`Vipps-ordre ${order.id} avbroten (${name})`);
        }
        break;
      }

      default:
        console.log(`Vipps webhook: uhandtert event ${name} (${reference})`);
    }
  } catch (error) {
    console.error("Feil ved behandling av Vipps-webhook:", error);
    // Frigi kravet slik at Vipps sin retry (med backoff) kan kravsette
    // eventet på nytt. Hvis frigivelsen selv feiler, blir eventet stående
    // kravsatt - tryggere enn å risikere dobbel behandling.
    try {
      await releaseWebhookEvent(db, eventId);
    } catch (releaseError) {
      console.error(
        `Klarte ikkje å frigi webhook-krav for ${eventId}:`,
        releaseError
      );
    }
    return NextResponse.json(
      { error: "Feil ved behandling av webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

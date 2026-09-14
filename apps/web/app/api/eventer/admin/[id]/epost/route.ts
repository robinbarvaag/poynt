import { getAdminUser } from "@/lib/events/admin-auth";
import { formatEventRange } from "@/lib/events/format";
import { getMessageRecipients, isMessageAudience } from "@/lib/events/messages";
import { type NextRequest, NextResponse } from "next/server";

const MAX_SUBJECT = 150;
const MAX_MESSAGE = 5000;

/**
 * Beskjed på e-post til de påmeldte på ett event, fra «Påmeldte»-fanen.
 * `preview: true` sender ingenting, men svarer med antall mottakere.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    audience?: unknown;
    subject?: unknown;
    message?: unknown;
    preview?: unknown;
  };
  if (!isMessageAudience(body.audience)) {
    return NextResponse.json(
      { error: "Velg hvem beskjeden skal til." },
      { status: 400 }
    );
  }

  const found = await getMessageRecipients(Number(id), body.audience);
  if (!found) {
    return NextResponse.json({ error: "Fant ikke eventet." }, { status: 404 });
  }
  const { event, recipients } = found;

  if (body.preview === true) {
    return NextResponse.json({ count: recipients.length });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!subject || !message) {
    return NextResponse.json(
      { error: "Skriv både emne og melding." },
      { status: 400 }
    );
  }
  if (subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      {
        error: `Emnet kan være maks ${MAX_SUBJECT} tegn og meldingen maks ${MAX_MESSAGE}.`,
      },
      { status: 400 }
    );
  }
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Ingen å sende til." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "E-post er ikke satt opp på serveren." },
      { status: 503 }
    );
  }

  const [{ sendEventMessageEmails }, { getNotificationEmails }] =
    await Promise.all([
      import("@poynt/email"),
      import("@/lib/notification-emails"),
    ]);
  const result = await sendEventMessageEmails({
    eventTitle: event.title,
    when: formatEventRange(event.startsAt, event.endsAt),
    subject,
    message,
    replyTo: (await getNotificationEmails())[0],
    recipients,
  });
  // Bare antall i loggen — ingen adresser.
  console.log(
    `Beskjed til påmeldte (event ${event.id}): ${result.sent} sendt, ${result.failed} feilet`
  );

  return NextResponse.json({ ok: result.failed === 0, ...result });
}

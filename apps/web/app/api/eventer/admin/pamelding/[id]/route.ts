import { getAdminUser } from "@/lib/events/admin-auth";
import {
  sendCancellationEmail,
  sendRegistrationEmail,
} from "@/lib/events/notify";
import {
  cancelRegistration,
  checkInRegistration,
  deleteRegistration,
  getRegistrationWithToken,
  promoteRegistration,
  undoCheckIn,
} from "@/lib/events/registrations";
import { type NextRequest, NextResponse } from "next/server";

type Action =
  | "cancel"
  | "promote"
  | "check-in"
  | "undo-check-in"
  | "resend"
  | "delete";

/** Handlinger på én påmelding fra Påmeldte-fanen. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const { id } = await params;
  const registrationId = Number(id);
  const body = (await request.json().catch(() => ({}))) as {
    action?: Action;
    /** Send e-post til personen ved avmelding. */
    notify?: boolean;
  };

  const current = await getRegistrationWithToken(registrationId);
  if (!current) {
    return NextResponse.json(
      { error: "Fant ikke påmeldingen." },
      { status: 404 }
    );
  }
  const event = current.event;

  switch (body.action) {
    case "cancel": {
      const result = await cancelRegistration({ registrationId, by: "admin" });
      if (result && !result.alreadyCancelled) {
        await Promise.all([
          body.notify
            ? sendCancellationEmail(event, result.registration, true)
            : Promise.resolve(),
          result.promoted
            ? sendRegistrationEmail(event, result.promoted, { promoted: true })
            : Promise.resolve(),
        ]);
      }
      return NextResponse.json({
        ok: true,
        promoted: result?.promoted?.name ?? null,
      });
    }

    case "promote": {
      const promoted = await promoteRegistration(registrationId);
      if (!promoted) {
        return NextResponse.json(
          { error: "Personen står ikke på ventelista." },
          { status: 409 }
        );
      }
      await sendRegistrationEmail(event, promoted, { promoted: true });
      return NextResponse.json({ ok: true });
    }

    case "check-in": {
      const result = await checkInRegistration({
        code: current.code,
        userId: user.id as number,
        force: true,
      });
      return NextResponse.json({ ok: result.outcome === "ok", ...result });
    }

    case "delete": {
      // Når noen ber om å bli slettet: fjernes helt, ikke bare meldt av.
      const result = await deleteRegistration(registrationId);
      if (result.promoted) {
        await sendRegistrationEmail(event, result.promoted, { promoted: true });
      }
      return NextResponse.json({
        ok: result.deleted,
        promoted: result.promoted?.name ?? null,
      });
    }

    case "undo-check-in": {
      const updated = await undoCheckIn(registrationId);
      return NextResponse.json({ ok: Boolean(updated) });
    }

    case "resend": {
      if (current.status === "cancelled") {
        return NextResponse.json(
          { error: "Påmeldingen er avmeldt." },
          { status: 409 }
        );
      }
      await sendRegistrationEmail(event, current);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Ukjent handling." }, { status: 400 });
  }
}

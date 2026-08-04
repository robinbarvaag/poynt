import {
  sendNewsletterSignupNotification,
  subscribeToNewsletter,
} from "@poynt/email";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-postadresse er påkrevd" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ugyldig e-postadresse" },
        { status: 400 }
      );
    }

    const result = await subscribeToNewsletter(email);

    if (!result.success) {
      console.error("Newsletter subscription failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Kunne ikke registrere e-postadressen" },
        { status: 500 }
      );
    }

    // Internt varsel til oss — aldri la det velte selve påmeldingen.
    try {
      const { getNotificationEmails } = await import(
        "@/lib/notification-emails"
      );
      await sendNewsletterSignupNotification({
        to: await getNotificationEmails(),
        email,
        source: "nyhetsbrev-skjema",
      });
    } catch (notifyError) {
      console.error("Nyhetsbrev-varsel feilet:", notifyError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "En feil oppstod. Prøv igjen senere." },
      { status: 500 }
    );
  }
}

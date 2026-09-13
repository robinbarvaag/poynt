import {
  BOOK_COOKIE_MAX_AGE,
  BOOK_STORES,
  bookCookieName,
  createBookCookieValue,
  isPlausibleOrderNumber,
  normalizeOrderNumber,
} from "@/lib/book-access";
import { subscribeWithConsent } from "@/lib/newsletter-consent";
import { NEWSLETTER_CONSENT_TEXTS } from "@/lib/newsletter-consent-texts";
import config from "@/payload.config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Låser opp en side som krever bokkjøp (se lib/book-access.ts): sjekker
 * ordrenummer-formatet, logger i «Boktilganger» og setter en signert cookie.
 */
export async function POST(request: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(request.headers);
  if (!rateLimit("book-access", ip, { limit: 8, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen om noen minutter." },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      pageId?: unknown;
      orderNumber?: unknown;
      store?: unknown;
      email?: unknown;
      newsletter?: unknown;
    };

    const pageId = Number(body.pageId);
    const orderNumber = normalizeOrderNumber(String(body.orderNumber ?? ""));
    const store = BOOK_STORES.find((s) => s.value === body.store)?.value;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const newsletter = body.newsletter === true && Boolean(email);

    if (!store) {
      return NextResponse.json(
        { error: "Velg hvor du kjøpte boka." },
        { status: 400 }
      );
    }
    if (!isPlausibleOrderNumber(orderNumber)) {
      return NextResponse.json(
        {
          error:
            "Det ser ikke ut som et ordrenummer. Du finner det i ordrebekreftelsen på e-post.",
        },
        { status: 400 }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Sjekk e-postadressen." },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    const page = Number.isInteger(pageId)
      ? await payload
          .findByID({ collection: "pages", id: pageId, depth: 0 })
          .catch(() => null)
      : null;
    if (!page?.bookGate || page._status !== "published") {
      return NextResponse.json({ error: "Fant ikke siden." }, { status: 404 });
    }

    const existing = await payload.find({
      collection: "book-access",
      where: {
        orderNumber: { equals: orderNumber },
        page: { equals: page.id },
      },
      limit: 1,
      depth: 0,
    });
    const previous = existing.docs[0];

    if (previous?.blocked) {
      return NextResponse.json(
        {
          error:
            "Dette ordrenummeret er sperret. Ta kontakt med oss hvis du mener det er feil.",
        },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const access = previous
      ? await payload.update({
          collection: "book-access",
          id: previous.id,
          data: {
            uses: (previous.uses ?? 1) + 1,
            lastUsedAt: now,
            // Behold første e-post, men fyll inn om den manglet.
            email: previous.email || email || undefined,
            newsletterOptIn: previous.newsletterOptIn || newsletter,
          },
          overrideAccess: true,
        })
      : await payload.create({
          collection: "book-access",
          data: {
            orderNumber,
            store,
            page: page.id,
            email: email || undefined,
            newsletterOptIn: newsletter,
            uses: 1,
            lastUsedAt: now,
          },
          overrideAccess: true,
        });

    // Bare første gang — gjenbruk av samme ordrenummer skal ikke gi nye varsler.
    if (newsletter && !previous?.newsletterOptIn) {
      // Påmeldinga skal aldri stoppe opplåsinga.
      const result = await subscribeWithConsent({
        email,
        source: "book-access",
        consentText: NEWSLETTER_CONSENT_TEXTS.bookAccess,
        path: page.slug ? `/${page.slug}` : undefined,
        reference: access.id,
      });
      if (!result.success) {
        console.error("Nyhetsbrev fra boktilgang feilet:", result.error);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      bookCookieName(page.id),
      createBookCookieValue(page.id, access.id),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: BOOK_COOKIE_MAX_AGE,
      }
    );
    return response;
  } catch (error) {
    console.error("Boktilgang feilet:", error);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen litt senere." },
      { status: 500 }
    );
  }
}

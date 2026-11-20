import { describe, expect, test } from "bun:test";
import {
  applyEmailDelivery,
  isEmailLive,
  resolveEmailDelivery,
} from "@poynt/email/delivery";

const message = {
  from: "Poynt <hei@poynt.no>",
  to: "kunde@eksempel.no",
  cc: "kopi@eksempel.no",
  bcc: ["blind@eksempel.no"],
  subject: "Kvittering",
  html: "<p>Hei</p>",
};

describe("resolveEmailDelivery", () => {
  test("er lukket som standard", () => {
    expect(resolveEmailDelivery({})).toEqual({ mode: "blocked" });
    expect(isEmailLive({})).toBe(false);
  });

  test("preview og development på Vercel er ikke live", () => {
    expect(isEmailLive({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isEmailLive({ VERCEL_ENV: "development" })).toBe(false);
    expect(isEmailLive({ NODE_ENV: "production" })).toBe(false);
  });

  test("produksjon på Vercel eller eksplisitt EMAIL_DELIVERY=live er live", () => {
    expect(isEmailLive({ VERCEL_ENV: "production" })).toBe(true);
    expect(isEmailLive({ EMAIL_DELIVERY: "live" })).toBe(true);
  });

  test("EMAIL_DEV_REDIRECT gir omdirigering, kommaseparert", () => {
    expect(
      resolveEmailDelivery({ EMAIL_DEV_REDIRECT: " a@x.no, b@x.no ," })
    ).toEqual({ mode: "redirect", to: ["a@x.no", "b@x.no"] });
  });

  test("live vinner over omdirigering", () => {
    expect(
      resolveEmailDelivery({
        VERCEL_ENV: "production",
        EMAIL_DEV_REDIRECT: "a@x.no",
      })
    ).toEqual({ mode: "live" });
  });
});

describe("applyEmailDelivery", () => {
  test("live sender meldingen urørt", () => {
    expect(applyEmailDelivery(message, { VERCEL_ENV: "production" })).toBe(
      message
    );
  });

  test("uten omdirigering stoppes meldingen", () => {
    expect(applyEmailDelivery(message, {})).toBeNull();
  });

  test("omdirigering bytter mottaker, fjerner kopier og merker emnet", () => {
    const result = applyEmailDelivery(message, {
      EMAIL_DEV_REDIRECT: "meg@x.no",
    });
    expect<unknown>(result?.to).toEqual(["meg@x.no"]);
    expect(result?.subject).toBe("[DEV → kunde@eksempel.no] Kvittering");
    expect(result).not.toHaveProperty("cc");
    expect(result).not.toHaveProperty("bcc");
    expect(result?.html).toBe(message.html);
  });

  test("flere mottakere og nodemailer-adresser vises i emnet", () => {
    const result = applyEmailDelivery(
      {
        to: ["a@eksempel.no", { name: "B", address: "b@eksempel.no" }],
        subject: "Hei",
      },
      { EMAIL_DEV_REDIRECT: "meg@x.no" }
    );
    expect(result?.subject).toBe("[DEV → a@eksempel.no, b@eksempel.no] Hei");
  });
});

import { sendMagicLinkEmail } from "@poynt/email";
import { db } from "@poynt/on-poynt-db";
import * as schema from "@poynt/on-poynt-db/schema";
import {
  RECAPTCHA_HEADER,
  recaptchaErrorMessage,
  verifyRecaptcha,
} from "@poynt/utils/recaptcha";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { UNKNOWN_MEMBER_MESSAGE } from "./messages";

export const auth = betterAuth({
  appName: "On Poynt",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/on-poynt/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.onPoyntUser,
      session: schema.onPoyntSession,
      account: schema.onPoyntAccount,
      verification: schema.onPoyntVerification,
    },
  }),

  // Disable email+password - members use magic link or Google
  emailAndPassword: {
    enabled: false,
  },

  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Innlogging er for godkjente medlemmer: kontoen opprettes når Susanne
      // godkjenner søknaden (admin/actions/applications.ts), aldri ved
      // innlogging. Ukjent Google-konto → ?error=signup_disabled på
      // innloggingssida. Kjent e-post lenkes til den forhåndsopprettede
      // brukeren (Google bekrefter e-posten, brukeren er emailVerified).
      disableSignUp: true,
    },
  },

  // Session: 30-day expiry, revalidate daily, cache in cookie for 1 hour
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Revalidate every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1-hour cookie cache
    },
  },

  hooks: {
    /**
     * reCAPTCHA v3 foran magic link-innsendingen: uten den kan hvem som helst
     * be oss sende innloggings-e-post til vilkårlige adresser i løkke (både
     * spam for mottakeren og Resend-kvote for oss). Google-innlogging går via
     * OAuth-redirect og trenger ingen sjekk.
     *
     * Tokenet sendes som header fra innloggingssida. Uten
     * RECAPTCHA_SECRET_KEY slipper alt gjennom (se @poynt/utils/recaptcha).
     */
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/magic-link") return;

      const headers = ctx.headers ?? new Headers();
      const result = await verifyRecaptcha(headers.get(RECAPTCHA_HEADER), {
        action: "innlogging",
        remoteIp: headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      });

      if (!result.ok) {
        console.warn(
          `[recaptcha] avviste magic link: ${result.reason}`,
          result.score !== undefined ? `score=${result.score}` : ""
        );
        throw new APIError("FORBIDDEN", {
          message: recaptchaErrorMessage(result.reason),
        });
      }

      // Kun godkjente medlemmer har en konto. Sjekk FØR vi sender lenka, så
      // ukjente adresser får et tydelig svar i stedet for en e-post som ender
      // i «new_user_signup_disabled». Bevisst avveining: dette røper om en
      // e-post er medlem, men for en lukket medlemsportal veier klar
      // tilbakemelding tyngre.
      const email = String(ctx.body?.email ?? "")
        .trim()
        .toLowerCase();
      const existing = email
        ? await ctx.context.internalAdapter.findUserByEmail(email)
        : null;
      if (!existing) {
        throw new APIError("FORBIDDEN", {
          message: UNKNOWN_MEMBER_MESSAGE,
        });
      }
    }),
  },

  // Plugins
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // I utvikling: logg lenka til konsollen så innlogging kan testes for
        // hvilken som helst e-post UTEN et verifisert Resend-domene (sandbox
        // leverer kun til kontoens egen adresse).
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n🔗 Magic link for ${email}:\n${url}\n`);
        }
        try {
          await sendMagicLinkEmail({ email, url, expiresInMinutes: 10 });
        } catch (err) {
          // I produksjon må feilen boble opp; i utvikling har vi lenka i loggen.
          if (process.env.NODE_ENV === "production") throw err;
          console.warn(
            "Magic-link e-post ikke sendt (bruk logget lenke over):",
            err
          );
        }
      },
      expiresIn: 60 * 10, // 10 minutes
      // Sikkerhetsnett bak sjekken i `hooks.before`: skulle en lenke likevel
      // nå verify for en ukjent e-post, opprettes det ingen konto.
      disableSignUp: true,
    }),
  ],
});

// Export session type for use in app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

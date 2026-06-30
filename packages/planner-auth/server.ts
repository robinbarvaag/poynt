import { sendMagicLinkEmail } from "@poynt/email";
import { db } from "@poynt/planner-db";
import * as schema from "@poynt/planner-db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "On Poynt",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/on-poynt/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.plannerUser,
      session: schema.plannerSession,
      account: schema.plannerAccount,
      verification: schema.plannerVerification,
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
    }),
  ],
});

// Export session type for use in app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

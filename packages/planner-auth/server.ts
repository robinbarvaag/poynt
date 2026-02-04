import { getResend } from "@poynt/email";
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
        const resend = getResend();
        await resend.emails.send({
          from: "On Poynt <onboarding@resend.dev>", // TODO: Change to verified domain
          to: email,
          subject: "Logg inn på On Poynt",
          html: `
            <h2>Logg inn på On Poynt</h2>
            <p>Klikk på lenken under for å logge inn:</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Logg inn</a></p>
            <p style="color:#666;font-size:12px;">Denne lenken utløper om 10 minutter. Hvis du ikke ba om denne e-posten, kan du trygt ignorere den.</p>
          `,
        });
      },
      expiresIn: 60 * 10, // 10 minutes
    }),
  ],
});

// Export session type for use in app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

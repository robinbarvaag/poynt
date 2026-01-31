import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@poynt/planner-db";
import * as schema from "@poynt/planner-db/schema";

export const auth = betterAuth({
  appName: "MarkedsPilot",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/planner/api/auth", // Planner-specific auth path
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      // Map better-auth expected names to our prefixed tables
      user: schema.plannerUser,
      session: schema.plannerSession,
      account: schema.plannerAccount,
      verification: schema.plannerVerification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Social providers - configure when ready
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Export session type for use in app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

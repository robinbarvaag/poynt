import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load from root .env first, then local
dotenv.config({ path: "../../.env" });
dotenv.config();

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URI!,
  },
  tablesFilter: ["planner_*"],
  verbose: true,
  strict: true,
});

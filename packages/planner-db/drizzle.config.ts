import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load from root .env first, then local
dotenv.config({ path: "../../.env" });
dotenv.config();

const databaseUri = process.env.DATABASE_URI;
if (!databaseUri) {
  throw new Error("DATABASE_URI is not set");
}

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUri,
  },
  schemaFilter: ["planner"],
  verbose: true,
  strict: true,
});

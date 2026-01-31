import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URI;

if (!connectionString) {
  throw new Error("DATABASE_URI environment variable is not set");
}

// For queries
const queryClient = postgres(connectionString);

// Create drizzle instance with schema for relational queries
export const db = drizzle(queryClient, { schema });

// Re-export schema
export * from "./schema";

// Export types
export type Database = typeof db;

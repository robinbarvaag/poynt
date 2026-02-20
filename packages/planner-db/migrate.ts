import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

dotenv.config({ path: "../../.env" });
dotenv.config();

const connectionString = process.env.DATABASE_URI;
if (!connectionString) {
  throw new Error("DATABASE_URI is not set");
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

console.log("Running migrations...");
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied successfully!");

await sql.end();

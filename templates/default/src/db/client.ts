import { Database } from "bun:sqlite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import postgres from "postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzleSqlite<typeof schema>>;
let dbType: "postgres" | "sqlite";

// Try PostgreSQL first, fallback to SQLite
async function initializeDatabase() {
  const pgUrl = process.env.DATABASE_URL;

  if (pgUrl?.startsWith("postgres")) {
    try {
      // Test PostgreSQL connection
      const client = postgres(pgUrl);
      await client`SELECT 1`;

      db = drizzlePg(client, { schema });
      dbType = "postgres";
      console.log("✅ Connected to PostgreSQL database");
      return;
    } catch (error) {
      console.warn(
        "⚠️  PostgreSQL connection failed, falling back to SQLite:",
        (error as Error).message,
      );
    }
  }

  // Fallback to SQLite
  const sqliteDb = new Database(process.env.SQLITE_PATH || "./db/app.db");
  db = drizzleSqlite(sqliteDb, { schema });
  dbType = "sqlite";
  console.log("✅ Using SQLite database");
}

// Initialize on module load
await initializeDatabase();

export { db, dbType };

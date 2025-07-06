import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db:
  | ReturnType<typeof drizzlePg<typeof schema>>
  | ReturnType<typeof drizzleSqlite<typeof schema>>
  | undefined;
let dbType: "postgres" | "sqlite" = "sqlite";

// Try PostgreSQL first, fallback to SQLite
async function initializeDatabase() {
  const pgUrl = process.env.DATABASE_URL;

  if (pgUrl?.startsWith("postgres")) {
    try {
      // Test PostgreSQL connection with timeout
      const client = postgres(pgUrl, {
        connect_timeout: 5, // 5 second timeout
        max: 1, // Only use 1 connection for initial test
      });
      await client`SELECT 1`;

      // Connection successful, create the actual client
      const mainClient = postgres(pgUrl);
      _db = drizzlePg(mainClient, { schema });
      dbType = "postgres";
      console.log("✅ Connected to PostgreSQL database");

      // Close the test client
      await client.end();
      return;
    } catch (error) {
      console.warn(
        "⚠️  PostgreSQL connection failed, falling back to SQLite:",
        (error as Error).message
      );
    }
  }

  // Fallback to SQLite
  const sqliteDb = new Database(process.env.SQLITE_PATH || "./db/app.db");
  _db = drizzleSqlite(sqliteDb, { schema });
  dbType = "sqlite";
  console.log("✅ Using SQLite database");
}

// Initialize on module load
await initializeDatabase();

// Helper function for simple queries that works with both database types
export async function executeSimpleQuery(query: string) {
  if (dbType === "postgres") {
    const pgDb = _db as ReturnType<typeof drizzlePg<typeof schema>>;
    // For PostgreSQL, we need to use the raw client
    // biome-ignore lint/suspicious/noExplicitAny: Accessing internal client property
    const client = (pgDb as any).client;
    return await client`${query}`;
  }
  // For SQLite, use the raw sql template
  const sqliteDb = _db as ReturnType<typeof drizzleSqlite<typeof schema>>;
  // biome-ignore lint/suspicious/noExplicitAny: Using raw sql
  return await (sqliteDb as any).all(sql.raw(query));
}

export { dbType };

// Export db with type assertion to make operations work with union types
// We know db is initialized before this module is imported due to top-level await
// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for union type workaround
export const db = _db as any as ReturnType<typeof drizzleSqlite<typeof schema>>;

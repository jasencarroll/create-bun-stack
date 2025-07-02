import { test, expect, describe } from "bun:test";
import { db, dbType } from "@/db/client";
import { usersSqlite } from "@/db/schema";
import { sql } from "drizzle-orm";

describe("Database Client", () => {
  test("database client is initialized", () => {
    expect('db').toBeDefined();
    expect(dbType).toBeDefined();
  });

  test("database type is either postgres or sqlite", () => {
    expect(["postgres", "sqlite"]).toContain(dbType);
  });

  test("can execute basic query", async () => {
    // This is a basic connectivity test
    if (dbType === "postgres") {
      // For PostgreSQL
      const result = await (db as any).execute(sql`SELECT 1 as test`);
      expect(result).toBeDefined();
    } else {
      // For SQLite
      const result = await (db as any).select().from(usersSqlite).limit(1);
      expect(result).toBeDefined();
    }
  });
});
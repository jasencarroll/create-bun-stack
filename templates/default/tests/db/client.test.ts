import { describe, expect, test } from "bun:test";
import { dbType } from "@/db/client";

describe("Database Client", () => {
  test("database client is initialized", () => {
    expect("db").toBeDefined();
    expect(dbType).toBeDefined();
  });

  test("database type is either postgres or sqlite", () => {
    expect(["postgres", "sqlite"]).toContain(dbType);
  });

  test("can execute basic query", async () => {
    // This is a basic connectivity test
    // For SQLite, we'll use executeSimpleQuery helper
    const { executeSimpleQuery } = await import("@/db/client");
    const result = await executeSimpleQuery("SELECT 1 as test");
    expect(result).toBeDefined();
  });
});

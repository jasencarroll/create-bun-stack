import { test, expect, describe, beforeAll } from "bun:test";
import { PostgresUserRepository } from "@/db/repositories/PostgresUserRepository";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";

describe("PostgresUserRepository", () => {
  // Skip these tests if no PostgreSQL is available
  const pgUrl = process.env.DATABASE_URL;
  const skipTests = !pgUrl?.startsWith("postgres");

  if (skipTests) {
    test.skip("PostgreSQL tests skipped - no DATABASE_URL configured", () => {});
    return;
  }

  let repository: PostgresUserRepository;
  let db: PostgresJsDatabase<typeof schema>;
  let client: ReturnType<typeof postgres>;

  beforeAll(async () => {
    try {
      client = postgres(pgUrl!);
      db = drizzle(client, { schema });
      
      // Schema should already exist from migrations
      // Just clear any existing test data
      try {
        await client`TRUNCATE TABLE users`;
      } catch (e) {
        // Table might not exist yet
      }
      
      repository = new PostgresUserRepository(db);
    } catch (error) {
      console.warn("PostgreSQL connection failed:", error);
      test.skip("PostgreSQL tests skipped - connection failed", () => {});
    }
  });

  describe("findAll", () => {
    test("returns all users", async () => {
      // Insert test data using repository
      await repository.create({ name: 'User 1', email: 'user1@example.com', password: null });
      await repository.create({ name: 'User 2', email: 'user2@example.com', password: null });
      
      const result = await repository.findAll();
      
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[1].email).toBe('user2@example.com');
    });

    // Add more PostgreSQL tests here following the same pattern as SQLite tests
    // but only if you have a real PostgreSQL instance to test against
  });
});
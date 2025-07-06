import { beforeAll, describe, expect, test } from "bun:test";
import { PostgresUserRepository } from "@/db/repositories/PostgresUserRepository";
import * as schema from "@/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

describe("PostgresUserRepository", () => {
  // Skip these tests if no PostgreSQL is available
  const pgUrl = process.env.DATABASE_URL;

  if (!pgUrl?.startsWith("postgres")) {
    test.skip("PostgreSQL tests skipped - no DATABASE_URL configured", () => {});
    return;
  }

  let repository: PostgresUserRepository;
  let db: PostgresJsDatabase<typeof schema>;
  let client: ReturnType<typeof postgres>;

  beforeAll(async () => {
    try {
      // Test connection with timeout
      client = postgres(pgUrl, {
        connect_timeout: 5,
      });

      // Test if we can connect
      await client`SELECT 1`;

      db = drizzle(client, { schema });

      // Schema should already exist from migrations
      // Just clear any existing test data
      try {
        await client`TRUNCATE TABLE users CASCADE`;
      } catch (_e) {
        // Table might not exist yet
      }

      repository = new PostgresUserRepository(db);
    } catch (error) {
      console.warn("PostgreSQL connection failed:", error);
      // Skip all tests in this describe block
      test.skip("PostgreSQL tests skipped - connection failed", () => {});
      throw error; // This will cause all tests to be skipped
    }
  });

  describe("findAll", () => {
    test("returns all users", async () => {
      // Insert test data using repository
      await repository.create({ name: "User 1", email: "user1@example.com", password: null });
      await repository.create({ name: "User 2", email: "user2@example.com", password: null });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe("user1@example.com");
      expect(result[1].email).toBe("user2@example.com");
    });

    // Add more PostgreSQL tests here following the same pattern as SQLite tests
    // but only if you have a real PostgreSQL instance to test against
  });
});

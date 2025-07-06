import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SQLiteUserRepository } from "@/db/repositories/SQLiteUserRepository";
import * as schema from "@/db/schema";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

describe("SQLiteUserRepository", () => {
  let repository: SQLiteUserRepository;
  let db: BunSQLiteDatabase<typeof schema>;
  let sqliteDb: Database;

  beforeEach(async () => {
    // Create in-memory database for tests
    sqliteDb = new Database(":memory:");
    db = drizzle(sqliteDb, { schema });

    // Create tables
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    repository = new SQLiteUserRepository(db);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe("findAll", () => {
    test("returns all users", async () => {
      // Insert test data
      sqliteDb.exec(`
        INSERT INTO users (id, name, email) VALUES 
        ('1', 'User 1', 'user1@example.com'),
        ('2', 'User 2', 'user2@example.com')
      `);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe("user1@example.com");
      expect(result[1].email).toBe("user2@example.com");
    });

    test("returns empty array when no users", async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    test("returns user when found", async () => {
      sqliteDb.exec(`
        INSERT INTO users (id, name, email) VALUES 
        ('123', 'Test User', 'test@example.com')
      `);

      const result = await repository.findById("123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("123");
      expect(result?.email).toBe("test@example.com");
    });

    test("returns null when user not found", async () => {
      const result = await repository.findById("999");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates and returns new user", async () => {
      const newUserData = {
        name: "New User",
        email: "new@example.com",
        password: "hashed",
      };

      const result = await repository.create(newUserData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(newUserData.name);
      expect(result.email).toBe(newUserData.email);
      expect(result.createdAt).toBeDefined();
    });
  });

  describe("update", () => {
    test("updates and returns user when found", async () => {
      sqliteDb.exec(`
        INSERT INTO users (id, name, email) VALUES 
        ('123', 'Original Name', 'test@example.com')
      `);

      const updates = { name: "Updated Name" };
      const result = await repository.update("123", updates);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated Name");
      expect(result?.email).toBe("test@example.com");
    });

    test("returns null when user not found", async () => {
      const result = await repository.update("999", { name: "Test" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("returns true when user deleted", async () => {
      sqliteDb.exec(`
        INSERT INTO users (id, name, email) VALUES 
        ('123', 'User to Delete', 'delete@example.com')
      `);

      const result = await repository.delete("123");
      expect(result).toBe(true);

      // Verify user is actually deleted
      const user = await repository.findById("123");
      expect(user).toBeNull();
    });

    test("returns false when user not found", async () => {
      const result = await repository.delete("999");
      expect(result).toBe(false);
    });
  });
});

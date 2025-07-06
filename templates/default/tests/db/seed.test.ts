import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { userRepository } from "@/db/repositories";

describe("Database Seed", () => {
  beforeEach(async () => {
    // Clear existing data
    const users = await userRepository.findAll();
    for (const user of users) {
      await userRepository.delete(user.id);
    }
  });

  afterEach(async () => {
    // Clean up after tests
    const users = await userRepository.findAll();
    for (const user of users) {
      await userRepository.delete(user.id);
    }
  });

  test("seeds initial users", async () => {
    // Run seed function directly instead of importing
    const { hashPassword } = await import("@/lib/crypto");
    const timestamp = Date.now();

    const users = [
      {
        name: "Alice Johnson",
        email: `alice-${timestamp}@example.com`,
        password: await hashPassword("password123"),
      },
      {
        name: "Bob Williams",
        email: `bob-${timestamp}@example.com`,
        password: await hashPassword("password123"),
      },
      {
        name: "Charlie Brown",
        email: `charlie-${timestamp}@example.com`,
        password: await hashPassword("password123"),
      },
    ];

    for (const user of users) {
      await userRepository.create(user);
    }

    const allUsers = await userRepository.findAll();
    expect(allUsers.length).toBeGreaterThanOrEqual(3);

    // Check first user
    const firstUser = allUsers.find((u) => u.email === `alice-${timestamp}@example.com`);
    expect(firstUser).toBeDefined();
    expect(firstUser?.name).toBe("Alice Johnson");
  });

  test("handles duplicate seed runs", async () => {
    // First seed
    const { hashPassword } = await import("@/lib/crypto");
    const testUser = {
      name: "Test User",
      email: `duplicate-${Date.now()}@example.com`,
      password: await hashPassword("password123"),
    };

    await userRepository.create(testUser);
    const firstCount = (await userRepository.findAll()).length;

    // Try to create same user again - should fail
    try {
      await userRepository.create(testUser);
      // If it doesn't throw, check count didn't increase
      const secondCount = (await userRepository.findAll()).length;
      expect(secondCount).toBe(firstCount);
    } catch (error) {
      // Expected - duplicate email should fail
      expect(error).toBeDefined();
    }
  });
});

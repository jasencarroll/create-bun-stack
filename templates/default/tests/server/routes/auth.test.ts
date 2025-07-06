import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { userRepository } from "@/db/repositories";
import { hashPassword } from "@/lib/crypto";
import { auth } from "@/server/routes/auth";
import { TEST_BASE_URL, createMockRequest, parseJsonResponse } from "../../helpers";

describe("Auth Routes", () => {
  beforeEach(async () => {
    // Clean up test data
    // Clean up test users using repository
    const users = await userRepository.findAll();
    for (const user of users) {
      if (user.email.includes("@test.")) {
        await userRepository.delete(user.id);
      }
    }
  });

  afterEach(async () => {
    // Clean up after tests
    // Clean up test users using repository
    const users = await userRepository.findAll();
    for (const user of users) {
      if (user.email.includes("@test.")) {
        await userRepository.delete(user.id);
      }
    }
  });

  describe("POST /api/auth/register", () => {
    test("registers new user with valid data", async () => {
      const newUser = {
        name: "New User",
        email: "new@test.example.com",
        password: "password123",
      };

      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify(newUser),
      });

      const response = await auth["/register"].POST(request);

      expect(response.status).toBe(201);
      const data = await parseJsonResponse<{
        token: string;
        user: { email: string; password?: string };
      }>(response);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(newUser.email);
      expect(data.user.password).toBeUndefined(); // Password should not be returned
    });

    test("returns 400 for duplicate email", async () => {
      // First create a user
      await userRepository.create({
        name: "Existing User",
        email: "existing@test.example.com",
        password: "hashed",
      });

      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          name: "New User",
          email: "existing@test.example.com",
          password: "password123",
        }),
      });

      const response = await auth["/register"].POST(request);
      expect(response.status).toBe(400);
      const data = await parseJsonResponse<{ error: string }>(response);
      expect(data.error).toContain("already exists");
    });

    test("returns 400 for invalid email format", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
        }),
      });

      const response = await auth["/register"].POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for missing password", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@test.example.com",
        }),
      });

      const response = await auth["/register"].POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for short password", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@test.example.com",
          password: "123",
        }),
      });

      const response = await auth["/register"].POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    test("logs in with valid credentials", async () => {
      // Create a user with known password hash
      const hashedPassword = await hashPassword("password123");
      await userRepository.create({
        name: "Test User",
        email: "login@test.example.com",
        password: hashedPassword,
      });

      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: "login@test.example.com",
          password: "password123",
        }),
      });

      const response = await auth["/login"].POST(request);

      expect(response.status).toBe(200);
      const data = await parseJsonResponse<{
        token: string;
        user: { email: string; password?: string };
      }>(response);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("login@test.example.com");
      expect(data.user.password).toBeUndefined();
    });

    test("returns 401 for wrong password", async () => {
      const hashedPassword = await hashPassword("password123");
      await userRepository.create({
        name: "Test User",
        email: "wrongpass@test.example.com",
        password: hashedPassword,
      });

      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: "wrongpass@test.example.com",
          password: "wrongpassword",
        }),
      });

      const response = await auth["/login"].POST(request);
      expect(response.status).toBe(401);
    });

    test("returns 401 for non-existent user", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: "nonexistent@test.example.com",
          password: "password123",
        }),
      });

      const response = await auth["/login"].POST(request);
      expect(response.status).toBe(401);
    });

    test("returns 400 for invalid email format", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: "invalid-email",
          password: "password123",
        }),
      });

      const response = await auth["/login"].POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for missing credentials", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await auth["/login"].POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for invalid JSON", async () => {
      const request = createMockRequest(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: "invalid json",
      });

      const response = await auth["/login"].POST(request);
      expect(response.status).toBe(400);
    });
  });
});

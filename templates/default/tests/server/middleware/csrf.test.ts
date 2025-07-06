import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { TEST_BASE_URL } from "../../helpers";

// Use real fetch

describe("CSRF Protection", () => {
  beforeAll(async () => {
    // Small delay to ensure server is ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Each test should use unique email addresses to avoid conflicts
    // No direct database access in integration tests
  });

  describe("CSRF Token Generation", () => {
    test("generates CSRF token on successful login", async () => {
      // Create test user via API
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CSRF Test User",
          email: `csrf-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const response = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `csrf-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);

      // Check for CSRF token in response
      const data = await response.json();
      expect(data.csrfToken).toBeDefined();
      expect(data.csrfToken).toBeTypeOf("string");
      expect(data.csrfToken.length).toBeGreaterThan(32);

      // Check for CSRF cookie
      const cookies = response.headers.get("Set-Cookie");
      expect(cookies).toContain("csrf-token");
      expect(cookies).toContain("HttpOnly");
      expect(cookies).toContain("SameSite=Strict");
    });

    test("generates CSRF token on successful registration", async () => {
      const timestamp = Date.now();
      const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New User",
          email: `newuser-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.csrfToken).toBeDefined();

      const cookies = response.headers.get("Set-Cookie");
      expect(cookies).toContain("csrf-token");
    });
  });

  describe("CSRF Token Validation", () => {
    let authToken: string;
    let csrfToken: string;
    let csrfCookie: string;

    beforeEach(async () => {
      // First register a user via API
      const timestamp = Date.now();
      const registerResponse = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: `validation-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status}`);
      }

      // Then login to get tokens
      const loginResponse = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `validation-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }

      const loginData = await loginResponse.json();
      authToken = loginData.token;
      csrfToken = loginData.csrfToken;

      // Extract CSRF cookie
      const cookies = loginResponse.headers.get("Set-Cookie");
      const csrfCookieMatch = cookies?.match(/csrf-token=([^;]+)/);
      csrfCookie = csrfCookieMatch?.[1] || "";
    });

    test("accepts valid CSRF token on POST requests", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-CSRF-Token": csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "New User",
          email: `newuser2-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(201);
    });

    test("rejects POST requests without CSRF token", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "New User",
          email: `newuser3-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("CSRF");
    });

    test("rejects POST requests with invalid CSRF token", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-CSRF-Token": "invalid-token",
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "New User",
          email: `newuser4-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(403);
    });

    test("rejects POST requests with mismatched CSRF token and cookie", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-CSRF-Token": csrfToken,
          Cookie: "csrf-token=wrong-cookie-value",
        },
        body: JSON.stringify({
          name: "New User",
          email: `newuser5-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(403);
    });

    test("allows GET requests without CSRF token", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });

    test("requires CSRF for PUT requests", async () => {
      // Create a user first via API
      const createResponse = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-CSRF-Token": csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "Update Test",
          email: `update-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });
      const user = await createResponse.json();

      const response = await fetch(`${TEST_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          // Missing CSRF token
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(response.status).toBe(403);
    });

    test("requires CSRF for DELETE requests", async () => {
      // Create a user first via API
      const createResponse = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-CSRF-Token": csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
        },
        body: JSON.stringify({
          name: "Delete Test",
          email: `delete-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });
      const user = await createResponse.json();

      const response = await fetch(`${TEST_BASE_URL}/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Missing CSRF token
          Cookie: `csrf-token=${csrfCookie}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("CSRF Exemptions", () => {
    test("login endpoint does not require CSRF token", async () => {
      // Register user via API first
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login Test",
          email: `login-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const response = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `login-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);
    });

    test("register endpoint does not require CSRF token", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Register Test",
          email: `register-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(201);
    });

    test("health check does not require CSRF token", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/health`);
      expect(response.status).toBe(200);
    });
  });

  describe("CSRF Token Lifecycle", () => {
    test("CSRF token is cleared on logout", async () => {
      // First register user via API
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Logout Test",
          email: `logout-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const loginResponse = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `logout-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const { token, csrfToken } = await loginResponse.json();
      const cookies = loginResponse.headers.get("Set-Cookie");
      const csrfCookieMatch = cookies?.match(/csrf-token=([^;]+)/);
      const csrfCookie = csrfCookieMatch?.[1] || "";

      // Logout
      const logoutResponse = await fetch(`${TEST_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
        },
      });

      expect(logoutResponse.status).toBe(200);

      // Check that CSRF cookie is cleared
      const logoutCookies = logoutResponse.headers.get("Set-Cookie");
      expect(logoutCookies).toContain("csrf-token=;");
      expect(logoutCookies).toContain("Max-Age=0");
    });

    test("old CSRF tokens are invalidated after new login", async () => {
      // Create user via API
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Token Rotation Test",
          email: `rotation-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      // First login
      const firstLogin = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `rotation-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const firstData = await firstLogin.json();
      const oldCsrfToken = firstData.csrfToken;

      // Second login (should invalidate old token)
      const secondLogin = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `rotation-${timestamp}@test.example.com`,
          password: "password123",
        }),
      });

      const secondData = await secondLogin.json();
      const newCsrfToken = secondData.csrfToken;

      // Tokens should be different
      expect(newCsrfToken).not.toBe(oldCsrfToken);

      // Try to use old CSRF token
      const response = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firstData.token}`,
          "X-CSRF-Token": oldCsrfToken,
          Cookie: `csrf-token=${oldCsrfToken}`,
        },
        body: JSON.stringify({
          name: "Should Fail",
          email: `shouldfail-${Date.now()}@test.example.com`,
          password: "password123",
        }),
      });

      expect(response.status).toBe(403);
    });
  });
});

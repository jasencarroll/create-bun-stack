import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { TEST_BASE_URL, TEST_PORT } from "../helpers";

// Use real fetch

describe("Security Integration Tests", () => {
  beforeAll(async () => {
    // Small delay to ensure server is ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Each test should use unique email addresses to avoid conflicts
    // No direct database access in integration tests
  });

  describe("Full Authentication Flow with Security", () => {
    test("complete secure authentication workflow", async () => {
      // 1. Register a new user
      const timestamp = Date.now();
      const registerResponse = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: TEST_BASE_URL,
        },
        body: JSON.stringify({
          name: "Integration Test User",
          email: `test-${timestamp}@integration.example.com`,
          password: "securePassword123",
        }),
      });

      if (registerResponse.status !== 201) {
        const errorText = await registerResponse.text();
        console.error(`Registration failed with status ${registerResponse.status}: ${errorText}`);
      }
      expect(registerResponse.status).toBe(201);

      // Check security headers are present
      expect(registerResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(registerResponse.headers.get("X-Frame-Options")).toBe("DENY");
      expect(registerResponse.headers.get("Access-Control-Allow-Origin")).toBe(TEST_BASE_URL);
      expect(registerResponse.headers.get("Access-Control-Allow-Credentials")).toBe("true");

      const registerData = await registerResponse.json();
      expect(registerData.token).toBeDefined();
      expect(registerData.csrfToken).toBeDefined();

      // Extract CSRF cookie
      const setCookieHeader = registerResponse.headers.get("Set-Cookie");
      expect(setCookieHeader).toContain("csrf-token");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Strict");

      const csrfCookieMatch = setCookieHeader?.match(/csrf-token=([^;]+)/);
      const csrfCookie = csrfCookieMatch?.[1] || "";

      // 2. Make an authenticated request to health endpoint (doesn't require admin)
      const healthResponse = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Authorization: `Bearer ${registerData.token}`,
          Origin: TEST_BASE_URL,
        },
      });

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.headers.get("Cache-Control")).toContain("no-store");

      // 3. Try to make a state-changing request without CSRF token (should fail)
      const createUserWithoutCsrf = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${registerData.token}`,
          Cookie: `csrf-token=${csrfCookie}`,
          Origin: TEST_BASE_URL,
        },
        body: JSON.stringify({
          name: "Should Fail",
          email: "fail@integration.example.com",
          password: "password123",
        }),
      });

      expect(createUserWithoutCsrf.status).toBe(403);
      const errorData = await createUserWithoutCsrf.json();
      expect(errorData.error).toContain("CSRF");

      // 4. Make the same request with CSRF token (should succeed)
      const createUserWithCsrf = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${registerData.token}`,
          "X-CSRF-Token": registerData.csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
          Origin: TEST_BASE_URL,
        },
        body: JSON.stringify({
          name: "Should Succeed",
          email: `success-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      expect(createUserWithCsrf.status).toBe(201);

      // 5. Logout and verify CSRF token is cleared
      const logoutResponse = await fetch(`${TEST_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${registerData.token}`,
          "X-CSRF-Token": registerData.csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
          Origin: TEST_BASE_URL,
        },
      });

      expect(logoutResponse.status).toBe(200);
      const logoutCookies = logoutResponse.headers.get("Set-Cookie");
      expect(logoutCookies).toContain("csrf-token=;");
      expect(logoutCookies).toContain("Max-Age=0");

      // 6. Try to use the old CSRF token after logout (should fail)
      const postLogoutRequest = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${registerData.token}`,
          "X-CSRF-Token": registerData.csrfToken,
          Cookie: `csrf-token=${csrfCookie}`,
          Origin: TEST_BASE_URL,
        },
        body: JSON.stringify({
          name: "After Logout",
          email: `afterlogout-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      expect(postLogoutRequest.status).toBe(403);
    });
  });

  describe("Cross-Origin Security", () => {
    test("handles cross-origin requests properly", async () => {
      // Create a user for testing via API
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CORS Test User",
          email: `cors-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      // 1. Preflight request from allowed origin
      const preflightResponse = await fetch(`${TEST_BASE_URL}/api/users`, {
        method: "OPTIONS",
        headers: {
          Origin: `http://localhost:${Number(TEST_PORT) + 1}`,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type, X-CSRF-Token",
        },
      });

      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers.get("Access-Control-Allow-Origin")).toBe(
        `http://localhost:${Number(TEST_PORT) + 1}`
      );
      expect(preflightResponse.headers.get("Access-Control-Allow-Headers")).toContain(
        "X-CSRF-Token"
      );

      // 2. Login from allowed origin
      const loginResponse = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: `http://localhost:${Number(TEST_PORT) + 1}`,
        },
        credentials: "include",
        body: JSON.stringify({
          email: `cors-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.headers.get("Access-Control-Allow-Credentials")).toBe("true");

      // 3. Request from disallowed origin
      // In development, all origins are allowed
      const disallowedResponse = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Origin: "https://evil.com",
        },
      });

      // In development mode, the origin is allowed
      if (process.env.NODE_ENV !== "production") {
        expect(disallowedResponse.headers.get("Access-Control-Allow-Origin")).toBe(
          "https://evil.com"
        );
      } else {
        expect(disallowedResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
      }
    });
  });

  describe("Security Headers on Different Response Types", () => {
    test("applies appropriate headers to different content types", async () => {
      // 1. HTML response
      const htmlResponse = await fetch(`${TEST_BASE_URL}/`);
      expect(htmlResponse.headers.get("Content-Security-Policy")).toBeTruthy();
      expect(htmlResponse.headers.get("X-Frame-Options")).toBe("DENY");

      // 2. API JSON response
      const apiResponse = await fetch(`${TEST_BASE_URL}/api/health`);
      expect(apiResponse.headers.get("Content-Type")).toContain("application/json");
      expect(apiResponse.headers.get("Cache-Control")).toContain("no-store");
      expect(apiResponse.headers.get("Content-Security-Policy")).toBeNull();

      // 3. Static asset response
      const staticResponse = await fetch(`${TEST_BASE_URL}/manifest.json`);
      expect(staticResponse.headers.get("Cache-Control")).toContain("public");
      expect(staticResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");

      // 4. JavaScript response (in development)
      if (process.env.NODE_ENV !== "production") {
        const jsResponse = await fetch(`${TEST_BASE_URL}/main.js`);
        expect(jsResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
      }
    });
  });

  describe("Attack Prevention", () => {
    test("prevents common attack vectors", async () => {
      // 1. Clickjacking protection
      const response = await fetch(`${TEST_BASE_URL}/`);
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");

      // 2. XSS protection
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(response.headers.get("Content-Security-Policy")).toBeTruthy();

      // 3. MIME type sniffing protection
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");

      // 4. Referrer leakage protection
      expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

      // 5. Feature policy restrictions
      expect(response.headers.get("Permissions-Policy")).toContain("geolocation=()");
      expect(response.headers.get("Permissions-Policy")).toContain("microphone=()");
      expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    });

    test("prevents CSRF attacks on state-changing operations", async () => {
      // Setup: Create a user and login via API
      const timestamp = Date.now();
      await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CSRF Attack Test",
          email: `csrfattack-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      const loginResponse = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `csrfattack-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });

      const { token, user } = await loginResponse.json();

      // Simulate CSRF attack: Try to delete user without CSRF token
      const deleteResponse = await fetch(`${TEST_BASE_URL}/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          // Missing CSRF token and cookie - simulating cross-site request
        },
      });

      expect(deleteResponse.status).toBe(403);

      // Verify user was not deleted by trying to login again
      const verifyResponse = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `csrfattack-${timestamp}@integration.example.com`,
          password: "password123",
        }),
      });
      expect(verifyResponse.status).toBe(200);
    });
  });
});

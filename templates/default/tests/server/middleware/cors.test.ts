import { beforeAll, describe, expect, test } from "bun:test";
import { TEST_BASE_URL } from "../../helpers";

// Use real fetch

const testOrigins = {
  allowed: TEST_BASE_URL,
  disallowed: "http://malicious-site.com",
};

describe("CORS Middleware", () => {
  beforeAll(async () => {
    // Small delay to ensure server is ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test("health check endpoint works with CORS", async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/health`, {
      headers: {
        Origin: TEST_BASE_URL,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("login endpoint works with CORS", async () => {
    const timestamp = Date.now();
    const response = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        Origin: TEST_BASE_URL,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `nonexistent-${timestamp}@example.com`,
        password: "wrongpassword",
      }),
    });

    // We expect 401 for wrong credentials, but CORS should still work
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });

  test("OPTIONS request returns 204", async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/users`, {
      method: "OPTIONS",
      headers: {
        Origin: TEST_BASE_URL,
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status).toBe(204);
  });

  describe("API vs Static Assets", () => {
    test("applies CORS headers to API routes", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Origin: testOrigins.allowed,
        },
      });

      expect(response).toBeDefined();
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
    });

    test("does not apply CORS headers to static assets", async () => {
      const response = await fetch(`${TEST_BASE_URL}/manifest.json`, {
        headers: {
          Origin: testOrigins.allowed,
        },
      });

      // Static assets should not have CORS headers by default
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Security Headers", () => {
    test("does not expose sensitive headers", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Origin: testOrigins.allowed,
        },
      });

      // Should not expose headers that could reveal server info
      expect(response.headers.get("X-Powered-By")).toBeNull();
    });

    test("sets Vary header for Origin", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/health`, {
        headers: {
          Origin: testOrigins.allowed,
        },
      });

      expect(response.headers.get("Vary")).toContain("Origin");
    });
  });
});

import { test, expect, describe, beforeAll } from "bun:test";

// Use real fetch

const testOrigins = {
  allowed: "http://localhost:3000",
  disallowed: "http://malicious-site.com"
};

describe("CORS Middleware", () => {
  beforeAll(async () => {
    // Small delay to ensure server is ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test("health check endpoint works with CORS", async () => {
    const response = await fetch("http://localhost:3000/api/health", {
      headers: {
        Origin: "http://localhost:3000",
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("users endpoint works with CORS", async () => {
    const response = await fetch("http://localhost:3000/api/users", {
      headers: {
        Origin: "http://localhost:3000",
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("OPTIONS request returns 204", async () => {
    const response = await fetch("http://localhost:3000/api/users", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });
    
    expect(response.status).toBe(204);
  });

  describe("API vs Static Assets", () => {
    test("applies CORS headers to API routes", async () => {
      const response = await fetch("http://localhost:3000/api/health", {
        headers: {
          "Origin": testOrigins.allowed,
        },
      });

      expect(response).toBeDefined();
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
    });

    test("does not apply CORS headers to static assets", async () => {
      const response = await fetch("http://localhost:3000/manifest.json", {
        headers: {
          "Origin": testOrigins.allowed,
        },
      });

      // Static assets should not have CORS headers by default
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Security Headers", () => {
    test("does not expose sensitive headers", async () => {
      const response = await fetch("http://localhost:3000/api/health", {
        headers: {
          "Origin": testOrigins.allowed,
        },
      });

      // Should not expose headers that could reveal server info
      expect(response.headers.get("X-Powered-By")).toBeNull();
    });

    test("sets Vary header for Origin", async () => {
      const response = await fetch("http://localhost:3000/api/health", {
        headers: {
          "Origin": testOrigins.allowed,
        },
      });

      expect(response.headers.get("Vary")).toContain("Origin");
    });
  });
});
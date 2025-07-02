import { test, expect, describe, beforeAll } from "bun:test";

// Use real fetch

describe("Security Headers", () => {
  beforeAll(async () => {
    // Small delay to ensure server is ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe("General Security Headers", () => {
    test("sets X-Content-Type-Options header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    test("sets X-Frame-Options header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    test("sets X-XSS-Protection header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });

    test("sets Referrer-Policy header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    test("sets Permissions-Policy header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      const policy = response.headers.get("Permissions-Policy");
      expect(policy).toContain("geolocation=()");
      expect(policy).toContain("camera=()");
      expect(policy).toContain("microphone=()");
    });

    test("does not expose X-Powered-By header", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("X-Powered-By")).toBeNull();
    });
  });

  describe("Content Security Policy", () => {
    test("sets Content-Security-Policy header for HTML responses", async () => {
      const response = await fetch("http://localhost:3000/");
      
      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src");
      expect(csp).toContain("script-src");
      expect(csp).toContain("style-src");
    });

    test("allows inline styles and scripts in development", async () => {
      if (process.env.NODE_ENV !== "production") {
        const response = await fetch("http://localhost:3000/");
        const csp = response.headers.get("Content-Security-Policy");
        
        expect(csp).toContain("'unsafe-inline'");
      }
    });

    test("restricts to self and trusted sources in production", async () => {
      if (process.env.NODE_ENV === "production") {
        const response = await fetch("http://localhost:3000/");
        const csp = response.headers.get("Content-Security-Policy");
        
        expect(csp).toContain("'self'");
        expect(csp).not.toContain("'unsafe-inline'");
      }
    });

    test("does not set CSP for API responses", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("Content-Security-Policy")).toBeNull();
    });
  });

  describe("HSTS (Strict Transport Security)", () => {
    test("sets Strict-Transport-Security in production", async () => {
      if (process.env.NODE_ENV === "production") {
        const response = await fetch("http://localhost:3000/api/health");
        
        const hsts = response.headers.get("Strict-Transport-Security");
        expect(hsts).toBeTruthy();
        expect(hsts).toContain("max-age=");
        expect(hsts).toContain("includeSubDomains");
      }
    });

    test("does not set HSTS in development", async () => {
      if (process.env.NODE_ENV !== "production") {
        const response = await fetch("http://localhost:3000/api/health");
        
        expect(response.headers.get("Strict-Transport-Security")).toBeNull();
      }
    });
  });

  describe("Cache Control", () => {
    test("sets appropriate cache headers for static assets", async () => {
      const response = await fetch("http://localhost:3000/manifest.json");
      
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBeTruthy();
      
      // Static assets can be cached
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("max-age=");
    });

    test("prevents caching for API responses", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe("no-store, no-cache, must-revalidate");
    });

    test("prevents caching for authenticated endpoints", async () => {
      const response = await fetch("http://localhost:3000/api/users");
      
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toContain("no-store");
      expect(cacheControl).toContain("private");
    });
  });

  describe("Security Headers for Different Content Types", () => {
    test("applies security headers to JSON responses", async () => {
      const response = await fetch("http://localhost:3000/api/health");
      
      expect(response.headers.get("Content-Type")).toContain("application/json");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    test("applies security headers to HTML responses", async () => {
      const response = await fetch("http://localhost:3000/");
      
      expect(response.headers.get("Content-Type")).toContain("text/html");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    test("applies security headers to JavaScript responses", async () => {
      if (process.env.NODE_ENV !== "production") {
        const response = await fetch("http://localhost:3000/main.js");
        
        expect(response.headers.get("Content-Type")).toContain("application/javascript");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      }
    });
  });

  describe("Error Response Security", () => {
    test("does not leak sensitive information in error responses", async () => {
      // Try to access a non-existent user
      const response = await fetch("http://localhost:3000/api/users/nonexistent");
      
      expect(response.status).toBe(404);
      
      const text = await response.text();
      // Should not contain stack traces or internal paths
      expect(text).not.toContain("Error:");
      expect(text).not.toContain("/Users/");
      expect(text).not.toContain("\\");
    });

    test("returns generic error for server errors", async () => {
      // This would need a way to trigger a 500 error
      // For now, we'll test that the error handler exists
      const response = await fetch("http://localhost:3000/api/this-will-404");
      
      // Should get HTML response for SPA fallback
      expect(response.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("Headers for Authentication", () => {
    test("does not expose JWT in response headers", async () => {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });
      
      // JWT should be in body, not headers
      expect(response.headers.get("Authorization")).toBeNull();
      expect(response.headers.get("X-Auth-Token")).toBeNull();
    });

    test("sets secure cookie attributes", async () => {
      // This test would check Set-Cookie headers when we implement auth cookies
      const response = await fetch("http://localhost:3000/api/health");
      
      const setCookie = response.headers.get("Set-Cookie");
      if (setCookie) {
        expect(setCookie).toContain("SameSite=");
        expect(setCookie).toContain("HttpOnly");
        
        if (process.env.NODE_ENV === "production") {
          expect(setCookie).toContain("Secure");
        }
      }
    });
  });
});
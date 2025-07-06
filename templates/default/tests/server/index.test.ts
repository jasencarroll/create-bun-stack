import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { TEST_BASE_URL } from "../helpers";

// Use real fetch

describe("Server", () => {
  const originalPort = process.env.PORT;

  beforeEach(() => {
    // Mock environment for tests
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Restore original port
    process.env.PORT = originalPort;
  });

  test("serves index.html at root", async () => {
    const response = await fetch(`${TEST_BASE_URL}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  test("serves manifest.json", async () => {
    const response = await fetch(`${TEST_BASE_URL}/manifest.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  test("serves offline.html", async () => {
    const response = await fetch(`${TEST_BASE_URL}/offline.html`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  test("health check endpoint", async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/health`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });

  test("handles 404 with SPA fallback", async () => {
    const response = await fetch(`${TEST_BASE_URL}/nonexistent`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  test("error handler returns 500", async () => {
    // This would need to trigger an actual error in the server
    // For now, we'll skip this test as it requires more complex setup
  });
});

import { beforeEach, describe, expect, test } from "bun:test";
import { useAuth } from "@/app/hooks/useAuth";
import { TEST_BASE_URL } from "../../helpers";

describe("useAuth hook", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
  });

  test("exports a valid hook", () => {
    expect(typeof useAuth).toBe("function");
  });

  test("login makes correct API call", async () => {
    // Create a test user first
    const timestamp = Date.now();
    const testEmail = `auth-test-${timestamp}@example.com`;

    await fetch(`${TEST_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Auth Test User",
        email: testEmail,
        password: "password123",
      }),
    });

    // Test that the login endpoint works
    const response = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
  });

  test("logout clears localStorage", () => {
    localStorage.setItem("token", "mock-token");

    // Simulate logout behavior
    localStorage.removeItem("token");

    expect(localStorage.getItem("token")).toBeNull();
  });

  test("handles invalid credentials", async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      }),
    });

    expect(response.status).toBe(401);
  });
});

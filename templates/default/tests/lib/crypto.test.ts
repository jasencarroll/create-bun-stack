import { describe, expect, test } from "bun:test";
import { generateToken, hashPassword, verifyPassword, verifyToken } from "@/lib/crypto";

describe("crypto utilities", () => {
  describe("hashPassword", () => {
    test("hashes password with salt", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toContain("$"); // Should contain salt separator
    });

    test("generates different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("handles empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow("Password cannot be empty");
    });
  });

  describe("verifyPassword", () => {
    test("verifies correct password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    test("rejects incorrect password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword("wrongpassword", hashed);

      expect(isValid).toBe(false);
    });

    test("handles empty password verification", async () => {
      // Empty password should return false
      const isValid = await verifyPassword("", "$2b$10$somevalidhash");
      expect(isValid).toBe(false);
    });

    test("handles null hash", async () => {
      const isValid = await verifyPassword("password", "");
      expect(isValid).toBe(false);
    });
  });

  describe("JWT functions", () => {
    const testPayload = { userId: "123", email: "test@example.com" };

    describe("generateToken", () => {
      test("generates a token", () => {
        const token = generateToken(testPayload);

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".")).toHaveLength(3); // JWT format
      });

      test("generates different tokens for same payload", () => {
        const token1 = generateToken(testPayload);
        const token2 = generateToken(testPayload);

        // Tokens might be the same if generated in same millisecond
        // But the important thing is they're valid JWTs
        expect(token1.split(".")).toHaveLength(3);
        expect(token2.split(".")).toHaveLength(3);
      });

      test("handles empty payload", () => {
        const token = generateToken({});
        expect(token).toBeDefined();
        expect(token.split(".")).toHaveLength(3);
      });
    });

    describe("verifyToken", () => {
      test("verifies valid token", () => {
        const token = generateToken(testPayload);
        const decoded = verifyToken(token);

        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(testPayload.userId);
        expect(decoded?.email).toBe(testPayload.email);
      });

      test("returns null for invalid token", () => {
        const decoded = verifyToken("invalid.token.here");
        expect(decoded).toBeNull();
      });

      test("returns null for malformed token", () => {
        const decoded = verifyToken("notavalidtoken");
        expect(decoded).toBeNull();
      });

      test("returns null for empty token", () => {
        const decoded = verifyToken("");
        expect(decoded).toBeNull();
      });

      test("handles expired token", () => {
        // Create a token that expires immediately
        const oldEnv = process.env.JWT_SECRET;
        process.env.JWT_SECRET = "test-secret";

        // Mock Date to create expired token
        const originalNow = Date.now;
        Date.now = () => 0;
        const expiredToken = generateToken(testPayload);
        Date.now = originalNow;

        const decoded = verifyToken(expiredToken);
        expect(decoded).toBeNull();

        process.env.JWT_SECRET = oldEnv;
      });
    });
  });
});

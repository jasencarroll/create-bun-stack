import { createHash } from "node:crypto";
import { env } from "../config/env";

// Hash password using Bun's built-in bcrypt implementation
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error("Password cannot be empty");
  }
  return await Bun.password.hash(password);
}

// Verify password using Bun's built-in bcrypt implementation
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!hashedPassword) return false;
  try {
    return await Bun.password.verify(password, hashedPassword);
  } catch {
    return false;
  }
}

// JWT configuration
const JWT_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

// Generate JWT token
export function generateToken(payload: Record<string, unknown>): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
    })
  ).toString("base64url");

  const signature = createHash("sha256")
    .update(`${encodedHeader}.${encodedPayload}${env.JWT_SECRET}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) return null;

    const testSignature = createHash("sha256")
      .update(`${encodedHeader}.${encodedPayload}${env.JWT_SECRET}`)
      .digest("base64url");

    if (signature !== testSignature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

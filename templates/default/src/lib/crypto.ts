import { createHash, randomBytes } from "node:crypto";

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(password + salt).digest("hex");
  return `${salt}$${hash}`;
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!hashedPassword) return false;
  const [salt, hash] = hashedPassword.split("$");
  if (!salt || !hash) return false;
  const testHash = createHash("sha256").update(password + salt).digest("hex");
  return hash === testHash;
}

// Generate JWT token
export function generateToken(payload: Record<string, unknown>): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  })).toString("base64url");
  
  const signature = createHash("sha256")
    .update(`${encodedHeader}.${encodedPayload}${process.env.JWT_SECRET || "secret"}`)
    .digest("base64url");
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    
    if (!encodedHeader || !encodedPayload || !signature) return null;
    
    const testSignature = createHash("sha256")
      .update(`${encodedHeader}.${encodedPayload}${process.env.JWT_SECRET || "secret"}`)
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
